# from groq import Groq
# from django.conf import settings
# from rest_framework.response import Response
# from rest_framework import status

# GROQ_API_KEY = settings.GROQ_API_KEY
# client = Groq(api_key=GROQ_API_KEY)

# class WebSearch:
#     def __init__(self, request):
#         self.request = request

#     def get_web_search(self):
#         prompt = self.request.data.get("prompt")
#         if not prompt:
#             return Response({"error": "Prompt is required"}, status=status.HTTP_400_BAD_REQUEST)

#         try:
#             completion = client.chat.completions.create(
#                 messages=[
#                     {
#                         "role": "user",
#                         "content": prompt,
#                     }
#                 ],
#                 model="compound-beta", 
#             )
#             response_content = completion.choices[0].message.content
#             return Response({"response": response_content}, status=status.HTTP_200_OK)
#         except Exception as e:
#             return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


from groq import Groq
from django.conf import settings
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime

GROQ_API_KEY = settings.GROQ_API_KEY
client = Groq(api_key=GROQ_API_KEY)

class WebSearch:
    def __init__(self, request):
        self.request = request

    def get_web_search(self):
        prompt = self.request.data.get("prompt")
        if not prompt:
            return Response({"error": "Prompt is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Add timestamp for context
            current_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            # Append date to prompt so model knows to give latest info
            full_prompt = f"As of {current_datetime}, provide an up-to-date answer based on the most current data available.\nPrompt: {prompt}"

            completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": full_prompt,
                    }
                ],
                model="compound-beta", 
            )

            response_content = completion.choices[0].message.content
            return Response({
                "timestamp": current_datetime,
                "response": response_content
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
