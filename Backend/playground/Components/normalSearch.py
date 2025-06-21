# from django.http import JsonResponse
# from django.views.decorators.csrf import csrf_exempt
# from django.utils.decorators import method_decorator
# from rest_framework.views import APIView
# import json
# import requests
# from django.conf import settings

# OLLAMA_URL = settings.OLLAMA_URL


# @method_decorator(csrf_exempt, name='dispatch')  # Apply CSRF exemption for class-based views
# class NormalSearch(APIView):
#     def post(self, request):
#         try:
#             data = json.loads(request.body)  # Load JSON data from request
#             prompt = data.get("prompt")
#             if not prompt:
#                 return JsonResponse({"error": "Prompt is required"}, status=400)

#             payload = {
#                 "model": "llama3.2:1b",
#                 "prompt": prompt,
#                 "stream": False
#             }

#             response = requests.post(OLLAMA_URL, json=payload, timeout=300)
#             response.raise_for_status()
#             result = response.json()

#             bot_response = result.get("response")
#             if not bot_response:
#                 return JsonResponse({"error": "No valid response from the model"}, status=500)

#             return JsonResponse({"response": bot_response})

#         except json.JSONDecodeError:
#             return JsonResponse({"error": "Invalid JSON format"}, status=400)
#         except requests.exceptions.RequestException as e:
#             return JsonResponse({"error": f"Ollama request failed: {e}"}, status=500)


from django.http import StreamingHttpResponse, JsonResponse
from django.conf import settings
from groq import Groq

GROQ_API_KEY = settings.GROQ_API_KEY
client = Groq(api_key=GROQ_API_KEY)

class NormalSearch:
    def __init__(self, request):
        self.request = request

    def get_normal_search(self):
        try:
            data = self.request.data
            prompt = data.get("prompt")
            if not prompt:
                return JsonResponse({"error": "Prompt is required"}, status=400)

            def stream_response():
                completion = client.chat.completions.create(
                    model="llama3-70b-8192",
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=1,
                    max_completion_tokens=1024,
                    top_p=1,
                    stream=True,
                    stop=None,
                )
                for chunk in completion:
                    content = chunk.choices[0].delta.content
                    if content:
                        yield content  

            return StreamingHttpResponse(stream_response(), content_type="text/plain")

        except Exception as e:
            return JsonResponse({"error": f"Groq request failed: {str(e)}"}, status=500)
