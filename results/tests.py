from rest_framework.test import APITestCase
from django.urls import reverse
from .models import Band, Crew, Club, Event


# Create your tests here.
class CrewTests(APITestCase):

    def setUp(self):
        club = Club.objects.create(name='My best rowing club', id=999999,)
        event = Event.objects.create(name='Event99', override_name='Event99', id=999999, info='info', type='type', gender='gender',)
        band = Band.objects.create(name='Band99', id=999999, event=999999)
        crew = Crew.objects.create(
            name='Alcock-Powell',
            composite_code='ALP',
            rowing_CRI=99,
            rowing_CRI_max=999,
            sculling_CRI=9999,
            sculling_CRI_max=99999,
            status='Accepted',
            penalty=0,
            masters_adjust_seconds=0,
            masters_adjust_minutes=0,
            manual_override_seconds=0,
            manual_override_minutes=0,
            manual_override_hundredths_seconds=0,
            bib_number=123,
            time_only=False,
            did_not_start=False,
            did_not_finish=False,
            )
        crew.club.set([club])
        crew.event.set([event])
        crew.band.set([band])

    def test_crews_index(self):
        """
        Should return an array of crews
        """

        url = reverse('crews-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, [{
            'id': 1,
            'name': 'My best rowing club',
            'composite_code': 'ALP',
            'rowing_CRI': '99',
            'rowing_CRI_max': '999',
            'sculling_CRI': '9999',
            'sculling_CRI_max': '99999',
            'status': 'Accepted',
            'penalty': 0,
            'masters_adjust_seconds':0,
            'masters_adjust_minutes':0,
            'manual_override_seconds':0,
            'manual_override_minutes':0,
            'manual_override_hundredths_seconds':0,
            'bib_number': 123,
            'club': [{
                'id': 999999,
                'name': 'My best rowing club',
            }],
            'event': [{
                'id': 999999,
                'name': 'Event99',
            }],
            'band': [{
                'id': 999999,
                'name': 'Band99',
            }],
            'event_band': None
        }])
