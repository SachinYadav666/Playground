from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from playground.Components.normalSearch import NormalSearch
from playground.Components.webSearch import WebSearch
from playground.Components.fileUpload import FileUpload
from playground.Components.imageSearch import ImageSearch
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import logging

# Set up logging for debugging
logger = logging.getLogger(__name__)

class Chat(APIView):
    @method_decorator(csrf_exempt, name='dispatch')
    def post(self, request):
        mode = request.data.get("mode")
        logger.info(f"Received request with mode: {mode}")

        if not mode:
            return Response({"error": "Mode is required"}, status=status.HTTP_400_BAD_REQUEST)

        if mode == "NormalSearch":
            logger.info("Handling NormalSearch")
            normal_search_api = NormalSearch(request)
            return normal_search_api.get_normal_search()

        elif mode == "WebSearch":
            logger.info("Handling WebSearch")
            web_search_api = WebSearch(request)
            return web_search_api.get_web_search()

        elif mode == "FileUpload":
            logger.info("Handling FileUpload")
            file_upload_api = FileUpload(request)
            return file_upload_api.get_fileUpload(request)
        
        elif mode == "ImageSearch":
            logger.info("Handling ImageSearch")
            image_query_api = ImageSearch(request)
            return image_query_api.get_image_search()

        else:
            logger.error(f"Invalid mode: {mode}")
            return Response({"error": "Invalid mode"}, status=status.HTTP_400_BAD_REQUEST)
