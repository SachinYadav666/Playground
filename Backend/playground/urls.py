from django.urls import path
from playground.views import Chat

urlpatterns = [
    path('chat/', Chat.as_view()),  
]
