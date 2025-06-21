import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from groq import Groq
import base64
from django.conf import settings

from io import BytesIO
from PIL import Image
GROQ_API_KEY = settings.GROQ_API_KEY

# Set up logging for debugging
logger = logging.getLogger(__name__)
client = Groq(api_key=GROQ_API_KEY) 
@csrf_exempt
class ImageSearch:
    def __init__(self, request):
        self.request = request

    def get_image_search(self):
        if self.request.method == 'POST' and self.request.FILES.get('image') and self.request.data.get('prompt'):
            image = self.request.FILES['image']
            prompt = self.request.data.get('prompt')

            try:
                # Convert the image to base64
                base64_image = self.encode_image(image)

                # Send image and prompt to Groq API
                groq_response = self.send_image_to_groq(base64_image, prompt)
                logger.info("Groq API Response: %s", groq_response)
                return JsonResponse({"message": groq_response})

            except Exception as e:
                logger.error("Error handling image upload or Groq API: %s", str(e))
                return JsonResponse({"error": f"Error: {str(e)}"}, status=500)

        return JsonResponse({'error': 'No image or prompt provided'}, status=400)

    def encode_image(self, image):
        """Convert an image to a base64-encoded string."""
        image_file = Image.open(image)
        buffer = BytesIO()
        image_file.save(buffer, format="JPEG")  
        image_bytes = buffer.getvalue()
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        return base64_image

    def send_image_to_groq(self, base64_image, prompt):
        """Send the base64-encoded image and prompt to the Groq API."""
        try:
            logger.info("Sending image request to Groq API...")
            completion = client.chat.completions.create(
                model="meta-llama/llama-4-maverick-17b-128e-instruct",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}",
                                },
                            },
                        ],
                    }
                ],
                temperature=1,
                max_completion_tokens=1024,
                top_p=1,
                stream=False,
                stop=None,
            )
            return completion.choices[0].message.content
        except Exception as e:
            raise Exception(f"Error with Groq API: {str(e)}")
