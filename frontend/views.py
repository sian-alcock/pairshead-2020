import os
from django.views.generic import View
from django.http import HttpResponse, HttpResponseNotFound

class Home(View):
    def get(self, _request):
        return HttpResponse("Hello World - Django is working!")

# class Home(View):
#     def get(self, _request):
#         file_path = os.path.join(os.path.dirname(__file__), 'dist', 'index.html')
#         print(f"Looking for index.html at: {file_path}")
#         print(f"File exists: {os.path.exists(file_path)}")
        
#         # List directory contents for debugging
#         dist_dir = os.path.join(os.path.dirname(__file__), 'dist')
#         if os.path.exists(dist_dir):
#             print(f"Contents of dist directory: {os.listdir(dist_dir)}")
#         else:
#             print(f"Dist directory doesn't exist at: {dist_dir}")
            
#         if os.path.exists(file_path):
#             with open(file_path) as file:
#                 return HttpResponse(file.read())
#         else:
#             return HttpResponse(f"index.html not found at {file_path}")

class Assets(View):
    def get(self, _requests, filename):
        path = os.path.join(os.path.dirname(__file__), 'dist', filename)
        if os.path.isfile(path):
            with open(path, 'rb') as file:
                return HttpResponse(file.read(), content_type='application/javascript')
        else:
            return HttpResponseNotFound()