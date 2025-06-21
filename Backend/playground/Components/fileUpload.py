from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
import tempfile
import os

# Cache: { refresh_id: (vectorstore, doc_splits) }
embedding_cache = {}

class FileUpload:
    
    def __init__(self, request):
        self.request = request
        
    def get_fileUpload(self, request):
        question = request.data.get("question")
        refresh_id = request.data.get("refresh_id")
        uploaded_file = request.FILES.get("file")
        print("Question:", question)
        print("Refresh ID:", refresh_id)
        print("File received:", uploaded_file.name if uploaded_file else "No file")


        if not question or not refresh_id:
            return Response({"error": "Question and refresh_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Handle new refresh_id or first time use
        if refresh_id not in embedding_cache:
            if not uploaded_file:
                return Response({"error": "File is required for new refresh_id"}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                with tempfile.NamedTemporaryFile(delete=False, suffix=".txt") as tmp_file:
                    for chunk in uploaded_file.chunks():
                        tmp_file.write(chunk)
                    temp_file_path = tmp_file.name

                loader = TextLoader(temp_file_path)
                docs = loader.load()
                splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(chunk_size=250, chunk_overlap=50)
                splits = splitter.split_documents(docs)

                embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
                vectorstore = FAISS.from_documents(splits, embedding_model)

                embedding_cache.clear()  
                embedding_cache[refresh_id] = (vectorstore, splits)

            finally:
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)

        # Use cached vectorstore
        vectorstore, splits = embedding_cache[refresh_id]
        retriever = vectorstore.as_retriever(search_kwargs={"k": min(4, len(splits))})

        prompt = PromptTemplate(
            template="""You are an assistant for question-answering tasks.
            Use the following documents to answer the question.
            If you don't know the answer, just say that you don't know.
            Use three sentences maximum and keep the answer concise:
            Question: {question}
            Documents: {documents}
            Answer:
            """,
            input_variables=["question", "documents"]
        )

        llm = ChatGroq(
            model_name="llama3-70b-8192",
            groq_api_key=settings.GROQ_API_KEY,
            temperature=0,
        )
        chain = prompt | llm | StrOutputParser()

        docs = retriever.invoke(question)
        doc_text = "\n".join([doc.page_content for doc in docs])
        answer = chain.invoke({"question": question, "documents": doc_text})

        return Response({
            "question": question,
            "answer": answer,
            "refresh_id": refresh_id
        }, status=status.HTTP_200_OK)
