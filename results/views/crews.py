from __future__ import absolute_import
import csv
import datetime
import os
import requests
import time

# if this is where you store your django-rest-framework settings
# from django.conf import settings
from django.db import transaction
from django.db.models import Min, Avg, Q
from rest_framework import status
from django.http import Http404, HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from rest_framework.pagination import PageNumberPagination
from rest_framework import filters, generics, serializers
from django_filters.rest_framework import DjangoFilterBackend
from .helpers import decode_utf8

from ..pagination import CrewPaginationWithAggregates
from ..serializers import (
    ClubSerializer,
    CrewSerializer,
    CrewSerializerLimited,
    CSVUpdateCrewSerializer,
    PopulatedCrewSerializer,
    WriteCrewSerializer,
    CrewExportSerializer,
)

from ..models import Crew, Race, RaceTime, OriginalEventCategory, EventMeetingKey


class CrewListView(generics.ListCreateAPIView):
    """paginated crew list"""

    serializer_class = PopulatedCrewSerializer
    pagination_class = CrewPaginationWithAggregates
    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
        DjangoFilterBackend,
    ]
    ordering_fields = "__all__"  # Allow ordering on all fields
    ordering = ["overall_rank"]  # Default ordering
    search_fields = [
        "name",
        "id",
        "club__name",
        "event_band",
        "bib_number",
        "competitor_names",
    ]
    filterset_fields = [
        "event_band",
        "start_time",
        "finish_time",
        "status",
        "event__gender",
    ]

    def get_queryset(self):
        """Get queryset to return based on params"""
        queryset = Crew.objects.all().select_related("club", "event")
        status_list = self.request.query_params.getlist("status[]")  # Note the []
        if status_list:
            print(f"Filtering by status: {status_list}")
            queryset = queryset.filter(status__in=status_list)
        else:
            print("No status filter applied")

        # Handle missing times filter
        missing_times = self.request.query_params.get("missing_times")
        if missing_times == "true":
            print("Filtering for crews with missing start or finish times")
            # Only show Accepted crews that are missing start_time OR finish_time (or both)
            # Note: We assume null/None values represent missing times
            queryset = queryset.filter(status="Accepted").filter(
                Q(start_time__isnull=True)
                | Q(start_time=0)
                | Q(finish_time__isnull=True)
                | Q(finish_time=0)
            )

        # Conditionally filter by published_time > 0 for results pages
        results_only = self.request.query_params.get("results_only")
        if results_only == "true":
            queryset = queryset.filter(published_time__gt=0).exclude(
                Q(disqualified=True) | Q(did_not_finish=True) | Q(did_not_start=True)
            )

        gender = self.request.query_params.get("gender")
        if gender and gender != "all":
            queryset = queryset.filter(event__gender=gender)

        masters = self.request.query_params.get("masters")
        if masters == "true":
            queryset = queryset.filter(masters_adjustment__gt=0)

        first_second_only = self.request.query_params.get("first_second_only")
        if first_second_only == "true":
            queryset = queryset.filter(category_rank__lte=2)

        # Handle special ordering cases that need custom logic
        order = self.request.query_params.get("order")
        ordering = self.request.query_params.get("ordering")

        # Use whichever one is provided
        order_field = order or ordering

        if order_field == "start-score":
            queryset = queryset.order_by("draw_start_score")
        elif order_field == "club":
            queryset = queryset.order_by("club__name", "name")
        elif order_field is not None:
            queryset = queryset.order_by(order_field)

        return queryset


class CrewListOptionsForSelect(APIView):
    def get(self, _request):
        crews = Crew.objects.filter(
            status__exact="Accepted"
        )  # get all the Accepted crews
        serializer = CrewSerializerLimited(crews, many=True)
        return Response(serializer.data)  # send the JSON to the client


class CrewGetEventBand(APIView):
    def get(self, _request):
        crews = Crew.objects.filter(
            status__exact="Accepted"
        )  # get all the Accepted crews
        serializer = CrewSerializer(crews, many=True)
        self.get_event_and_names(crews)
        return Response(serializer.data)  # send the JSON to the client

    def get_event_and_names(self, crews):
        # Get event band for all crews
        for crew in crews:
            crew.event_band = crew.calc_event_band()
            crew.competitor_names = crew.get_competitor_names()
            crew.save()


class UpdateStartOrdersView(APIView):
    """
    API endpoint to recalculate start orders for all crews.
    Call this when crew statuses change or you need to refresh calculations.
    """

    def post(self, request):
        try:
            updated_count = Crew.update_start_order_calcs()
            return Response(
                {
                    "success": True,
                    "message": f"Successfully updated start orders for {updated_count} crews",
                    "updated_crews": updated_count,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"success": False, "message": f"Error updating start orders: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class CrewUpdateRankings(APIView):
    """
    Should not be needed but can be run from frontend to recalculate
    """

    def get(self, _request):
        """Get crews for recalculation"""
        crews = Crew.objects.filter(status__exact="Accepted")
        serializer = CrewSerializer(crews, many=True)
        self.update_timing_calcs(crews)
        return Response(serializer.data)

    def update_timing_calcs(self, crews):
        """Recalculate rankings for all crews"""

        for crew in crews:
            crew.event_band = crew.calc_event_band()
            crew.raw_time = crew.calc_raw_time()
            crew.race_time = crew.calc_race_time()
            crew.published_time = crew.calc_published_time()
            crew.start_time = crew.calc_start_time()
            crew.finish_time = crew.calc_finish_time()
            crew.overall_rank = crew.calc_overall_rank()
            crew.gender_rank = crew.calc_gender_rank()
            crew.category_rank = crew.calc_category_rank()
            crew.category_position_time = crew.calc_category_position_time()
            crew.start_sequence = crew.calc_start_sequence()
            crew.finish_sequence = crew.calc_finish_sequence()
            crew.masters_adjustment = crew.calc_masters_adjustment()
            crew.requires_recalculation = False
            crew.save()


class CrewDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Update the crew data
    """

    queryset = Crew.objects.all()
    serializer_class = PopulatedCrewSerializer

    # Update computed properties after the assignment
    try:
        Crew.update_all_computed_properties()
    except Exception:
        pass


class CrewDataImport(APIView):

    def get(self, _request, personal=0):
        # Start by deleting all existing crews and times
        Crew.objects.all().delete()
        RaceTime.objects.all().delete()
        OriginalEventCategory.objects.all().delete()

        Meeting = EventMeetingKey.objects.get(
            current_event_meeting=True
        ).event_meeting_key

        UserAPI = os.getenv("USERAPI")  # As supplied in email
        UserAuth = os.getenv("USERAUTH")  # As supplied in email

        header = {"Authorization": UserAuth}
        request = {"api_key": UserAPI, "meetingIdentifier": Meeting}

        url = "https://webapi.britishrowing.org/api/OE2CrewInformation"  # change ENDPOINTNAME for the needed endpoint eg OE2MeetingSetup

        r = requests.post(url, json=request, headers=header)
        if r.status_code == 200:
            # pprint(r.json())

            for crew in r.json()["crews"]:

                if crew["competitionNotes"] == "TO":
                    time_only = True
                else:
                    time_only = False

                host_club_value = crew[
                    "boatingPermissionsClubID"
                ]  # This will be None if null

                if personal > 0:

                    data = {
                        "name": crew["name"],
                        "id": crew["id"],
                        "composite_code": crew["compositeCode"],
                        "club": crew["clubId"],
                        "rowing_CRI": crew["rowingCRI"],
                        "sculling_CRI": crew["scullingCRI"],
                        "event": crew["eventId"],
                        "status": crew["status"],
                        "bib_number": crew["customCrewNumber"],
                        "band": crew["bandId"],
                        "host_club": host_club_value,
                        "otd_contact": crew["competitionContactName"],
                        "otd_home_phone": crew["competitionContactHomePhone"],
                        "otd_mobile_phone": crew["competitionContactMobilePhone"],
                        "otd_work_phone": crew["competitionContactWorkPhone"],
                        "submitting_administrator_email": crew[
                            "submittingAdministratorEmail"
                        ],
                        "time_only": time_only,
                    }

                else:
                    data = {
                        "name": crew["name"],
                        "id": crew["id"],
                        "composite_code": crew["compositeCode"],
                        "club": crew["clubId"],
                        "rowing_CRI": crew["rowingCRI"],
                        "sculling_CRI": crew["scullingCRI"],
                        "event": crew["eventId"],
                        "status": crew["status"],
                        "bib_number": crew["customCrewNumber"],
                        "band": crew["bandId"],
                        "host_club": host_club_value,
                        "time_only": time_only,
                    }

                serializer = WriteCrewSerializer(data=data)
                serializer.is_valid(raise_exception=True)
                serializer.save()

            crews = Crew.objects.all()
            serializer = WriteCrewSerializer(crews, many=True)
            return Response(serializer.data)

        return Response(status=400)


class CrewDataExport(APIView):
    def get(self, _request):

        filename = "crewdataforimporttobroe - " + datetime.datetime.now().strftime(
            "%Y-%m-%d-%H-%M.csv"
        )

        crews = Crew.objects.filter(status__exact="Accepted")
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="' + filename + '"'
        writer = csv.writer(response, delimiter=",")
        writer.writerow(
            [
                "Crew ID",
                "Event ID",
                "Event",
                "Band",
                "Division",
                "Crew Name",
                "Crew Club",
                "Position In Event",
                "Raw Time",
                "Time",
                "Status",
            ]
        )

        for crew in crews:

            if crew.manual_override_time > 0:
                raw_time = crew.manual_override_time
            else:
                raw_time = crew.raw_time

            if raw_time == 0:
                rank = 0
            else:
                rank = crew.category_rank

            if raw_time > 0 and crew.time_only:
                status = "Time Only"
            elif crew.disqualified:
                status = "Disqualified"
            elif crew.did_not_start:
                status = "Did not start"
            elif crew.did_not_finish:
                status = "Did not finish"
            elif raw_time == 0 or raw_time is None:
                status = "Did not start"
            elif raw_time > 0:
                status = "Finished"

            if crew.band is None:
                band = ""
            else:
                band = crew.band.name

            if raw_time > 0:
                hundredths = int((raw_time / 10) % 100)
                seconds = int((raw_time / 1000) % 60)
                minutes = int((raw_time / (1000 * 60)) % 60)

                raw_time = (
                    str("%02d" % minutes)
                    + ":"
                    + str("%02d" % seconds)
                    + "."
                    + str("%02d" % hundredths)
                )
            else:
                raw_time = 0

            if crew.masters_adjusted_time > 0:
                hundredths = int((crew.masters_adjusted_time / 10) % 100)
                seconds = int((crew.masters_adjusted_time / 1000) % 60)
                minutes = int((crew.masters_adjusted_time / (1000 * 60)) % 60)
                race_time = (
                    str("%02d" % minutes)
                    + ":"
                    + str("%02d" % seconds)
                    + "."
                    + str("%02d" % hundredths)
                )

            elif crew.published_time > 0:
                hundredths = int((crew.published_time / 10) % 100)
                seconds = int((crew.published_time / 1000) % 60)
                minutes = int((crew.published_time / (1000 * 60)) % 60)

                race_time = (
                    str("%02d" % minutes)
                    + ":"
                    + str("%02d" % seconds)
                    + "."
                    + str("%02d" % hundredths)
                )
            else:
                race_time = 0

            writer.writerow(
                [
                    crew.id,
                    crew.event.id,
                    crew.event.name,
                    band,
                    "",
                    crew.name,
                    crew.club.name,
                    rank,
                    raw_time,
                    race_time,
                    status,
                ]
            )

        return response


class BibDataExport(APIView):
    def get(self, _request):
        filename = "bibdata - " + datetime.datetime.now().strftime("%Y-%m-%d-%H-%M.csv")

        crews = Crew.objects.filter(status__exact="Accepted")
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="' + filename + '"'

        writer = csv.writer(response, delimiter=",")
        writer.writerow(
            [
                "Crew ID",
                "Crew",
                "Bib",
            ]
        )

        for crew in crews:

            writer.writerow(
                [
                    crew.id,
                    crew.name,
                    crew.calculated_start_order,
                ]
            )

        return response


class StartOrderDataExport(APIView):
    def get(self, _request):
        filename = "startorderdata - " + datetime.datetime.now().strftime(
            "%Y-%m-%d-%H-%M.csv"
        )

        crews = Crew.objects.filter(status__in=["Accepted", "Scratched"]).order_by(
            "bib_number"
        )
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="' + filename + '"'

        writer = csv.writer(response, delimiter=",")
        writer.writerow(
            [
                "Status",
                "Crew No",
                "Crew",
                "Club",
                "Blade",
                "CompCode",
                "Category",
                "Host club",
                "Number location",
                "Marshalling division",
                "Time only",
            ]
        )

        for crew in crews:

            if crew.competitor_names is None:
                crew_name = crew.name
            else:
                crew_name = crew.competitor_names

            if crew.club.blade_image:
                image = '=IMAGE("' + crew.club.blade_image + '")'

            if crew.number_location is None:
                number_location = "⚠️ Missing number location!"
            else:
                number_location = crew.number_location

            if crew.time_only:
                time_only = "TO"
            else:
                time_only = ""

            writer.writerow(
                [
                    crew.status,
                    crew.bib_number,
                    crew_name,
                    crew.club.name,
                    image,
                    crew.composite_code,
                    crew.event_band,
                    crew.host_club.name,
                    number_location,
                    crew.marshalling_division,
                    time_only,
                ]
            )

        return response


class CrewStartOrderDataExport(APIView):
    def get(self, _request):

        crews = Crew.objects.filter(status__in=["Accepted", "Scratched"]).order_by(
            "bib_number"
        )
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = (
            'attachment; filename="crewstartorderdata.csv"'
        )

        writer = csv.writer(response, delimiter=",")
        writer.writerow(
            ["Bib", "Crew No", "Crew", "Club name", "Club code", "Event band"]
        )

        for crew in crews:

            if crew.competitor_names is None:
                crew_name = crew.name
            else:
                crew_name = crew.competitor_names

            writer.writerow(
                [
                    crew.bib_number,
                    crew.id,
                    crew.status,
                    crew_name,
                    crew.club.name,
                    crew.club.index_code,
                    crew.event_band,
                ]
            )

        return response


class CrewWebScorerDataExport(APIView):
    def get(self, _request):

        filename = "webscorerdata - " + datetime.datetime.now().strftime(
            "%Y-%m-%d-%H-%M.csv"
        )

        crews = Crew.objects.filter(status__exact="Accepted").order_by("bib_number")
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="' + filename + '"'

        writer = csv.writer(response, delimiter=",")
        writer.writerow(
            ["Name", "Team name", "Team name 2", "Category", "Bib", "Info 1"]
        )

        for crew in crews:

            if crew.competitor_names is None:
                crew_name = crew.club.index_code + " - " + crew.name
            else:
                crew_name = (
                    crew.club.index_code
                    + " - "
                    + crew.competitor_names.rsplit("/", 1)[-1]
                )

            writer.writerow(
                [
                    crew_name,
                    crew.club.name,
                    crew.id,
                    crew.event_band,
                    crew.bib_number,
                    crew.status,
                ]
            )

        return response


class CreateEventOrderTemplate(APIView):
    def get(self, _request):

        filename = "eventordertemplate - " + datetime.datetime.now().strftime(
            "%Y-%m-%d-%H-%M.csv"
        )

        crews = Crew.objects.filter(status__exact="Accepted")
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="' + filename + '"'

        writer = csv.writer(response, delimiter=",")
        writer.writerow(["Event", "Order"])

        unique_event_bands = []
        for crew in crews:
            # print(crew.id)
            crew.event_band = crew.calc_event_band()
            crew.save()

        for crew in crews:

            if crew.event_band not in unique_event_bands:
                unique_event_bands.append(crew.event_band)

                # print(unique_event_bands)

        for event in unique_event_bands:
            writer.writerow([event, ""])
            # print(event)

        return response


class CrewUniqueHostClub(generics.ListCreateAPIView):
    def get(self, _request):
        crews = Crew.objects.filter(status__exact="Accepted")
        unique_host_clubs = []
        data = []

        for crew in crews:

            if crew.host_club not in unique_host_clubs:
                unique_host_clubs.append(crew.host_club)

        for club in unique_host_clubs:

            data.append(ClubSerializer(club).data)

        return Response(data)


class CreatePenaltiesTemplate(APIView):
    def get(self, _request):

        filename = "penaltiestemplate - " + datetime.datetime.now().strftime(
            "%Y-%m-%d-%H-%M.csv"
        )

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="' + filename + '"'

        writer = csv.writer(response, delimiter=",")
        writer.writerow(
            [
                "Bib number",
                "Penalty (seconds)",
                "Time only (true/false/blank)",
                "Did not start (true/false/blank)",
                "Did not finish (true/false/blank)",
                "Disqualified (true/false/blank)",
            ]
        )

        return response


class CSVImportPenalties(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        """
        Import CSV file that includes penalties based on bib number match

        Expected CSV format:
        bib_number,penalty
        1,5
        8,10
        """
        serializer = CSVUpdateCrewSerializer(data=request.data)

        if serializer.is_valid():
            try:
                result = serializer.save()

                response_data = {
                    "success": True,
                    "message": "CSV import completed",
                    "results": result,
                }

                # Return different status codes based on whether there were errors
                if result["errors"]:
                    response_data["success"] = False
                    response_data["message"] = "CSV import completed with errors"
                    return Response(
                        response_data, status=status.HTTP_206_PARTIAL_CONTENT
                    )

                return Response(response_data, status=status.HTTP_200_OK)

            except Exception as e:
                return Response(
                    {"success": False, "message": f"Import failed: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return Response(
            {"success": False, "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )


class CrewBulkUpdateOverridesView(APIView):
    def patch(self, request):
        updates = request.data.get("updates", [])
        if not updates:
            return Response(
                {"error": "No updates provided"}, status=status.HTTP_400_BAD_REQUEST
            )
        try:
            with transaction.atomic():
                updated_crews = []
                for update in updates:
                    crew_id = update.get("crew_id")
                    if not crew_id:
                        continue
                    try:
                        crew = Crew.objects.get(id=crew_id)
                        if "race_id_start_override" in update:
                            race_id = update["race_id_start_override"]
                            crew.race_id_start_override_id = (
                                race_id if race_id else None
                            )
                        if "race_id_finish_override" in update:
                            race_id = update["race_id_finish_override"]
                            crew.race_id_finish_override_id = (
                                race_id if race_id else None
                            )
                        crew.save()
                        updated_crews.append(crew_id)
                    except Crew.DoesNotExist:
                        return Response(
                            {"error": f"Crew with id {crew_id} not found"},
                            status=status.HTTP_404_NOT_FOUND,
                        )
            return Response(
                {
                    "success": True,
                    "updated_count": len(updated_crews),
                    "updated_crew_ids": updated_crews,
                }
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ResultDataExport(APIView):

    def get(self, _request):

        filename = "resultdataexport - " + datetime.datetime.now().strftime(
            "%Y-%m-%d-%H-%M.csv"
        )

        crews = Crew.objects.filter(
            status__exact="Accepted",
            published_time__gt=0,
        ).order_by("overall_rank")
        fastest_female_scull = (
            Crew.objects.all()
            .filter(
                event_band__startswith="W", event_band__contains="2x", raw_time__gt=0
            )
            .aggregate(Min("raw_time"))
        )
        fastest_female_sweep = (
            Crew.objects.all()
            .filter(
                event_band__startswith="W", event_band__contains="2-", raw_time__gt=0
            )
            .aggregate(Min("raw_time"))
        )
        fastest_mixed_scull = (
            Crew.objects.all()
            .filter(
                event_band__startswith="Mx", event_band__contains="2x", raw_time__gt=0
            )
            .aggregate(Min("raw_time"))
        )
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="' + filename + '"'

        writer = csv.writer(response, delimiter=",")
        writer.writerow(
            [
                "Id",
                "Overall pos",
                "No",
                "Time",
                "Mas adj time",
                "Blade(img)",
                "Club",
                "Crew",
                "Com code",
                "Category",
                "Pos in Cat",
                "Pennant",
                "Trophy",
                "Penalty",
                "Time only",
            ]
        )

        for crew in crews:

            if crew.published_time == 0:
                rank = 0
            else:
                rank = crew.overall_rank

            if crew.published_time > 0:
                tenths = int((crew.published_time / 100) % 10)
                seconds = int((crew.published_time / 1000) % 60)
                minutes = int((crew.published_time / (1000 * 60)) % 60)

                published_time = (
                    str("%02d" % minutes)
                    + ":"
                    + str("%02d" % seconds)
                    + "."
                    + str("%01d" % tenths)
                )
            else:
                published_time = 0

            if crew.masters_adjusted_time > 0:
                tenths = int((crew.masters_adjusted_time / 100) % 10)
                seconds = int((crew.masters_adjusted_time / 1000) % 60)
                minutes = int((crew.masters_adjusted_time / (1000 * 60)) % 60)

                masters_adjusted_time = (
                    str("%02d" % minutes)
                    + ":"
                    + str("%02d" % seconds)
                    + "."
                    + str("%01d" % tenths)
                )
            else:
                masters_adjusted_time = ""

            if crew.penalty > 0:
                penalty = "P"
            else:
                penalty = ""

            if crew.time_only:
                time_only = "TO"
            else:
                time_only = ""

            if crew.category_rank == 0:
                category_rank = ""
            else:
                category_rank = crew.category_rank

            if crew.category_rank == 1:
                pennant = '=IMAGE("https://www.bblrc.co.uk/wp-content/uploads/2021/09/pennant-ph80.png")'
            else:
                pennant = ""

            if (
                crew.overall_rank == 1
                or crew.published_time == fastest_female_scull["raw_time__min"]
                or crew.published_time == fastest_female_sweep["raw_time__min"]
                or crew.published_time == fastest_mixed_scull["raw_time__min"]
            ):
                trophy = '=IMAGE("https://www.bblrc.co.uk/wp-content/uploads/2023/10/trophy_PH-2.jpg")'
            else:
                trophy = ""

            if crew.club.blade_image:
                image = '=IMAGE("' + crew.club.blade_image + '")'

            writer.writerow(
                [
                    crew.id,
                    rank,
                    crew.bib_number,
                    published_time,
                    masters_adjusted_time,
                    image,
                    crew.club.name,
                    crew.competitor_names,
                    crew.composite_code,
                    crew.event_band,
                    category_rank,
                    pennant,
                    trophy,
                    penalty,
                    time_only,
                ]
            )

            # print(crew.calc_published_time)
            # print(fastest_female_scull)
            # print(fastest_female_sweep)
            # print(fastest_mixed_scull)

        return response
