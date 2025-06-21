from django.contrib import admin
from django.urls import include, path

from django.http import JsonResponse

urlpatterns = [
    path("", lambda request: JsonResponse({"status": "Backend is live"})),
    path("playground/", include("playground.urls")),
    path("admin/", admin.site.urls),
]
