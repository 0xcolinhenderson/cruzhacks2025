from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings
import os
import shutil

def retriever(query, documents, db_location="./wiki_langchain_db"):
    """
    Embed and store documents in a Chroma vector store, then retrieve relevant chunks.
    """
    embeddings = OllamaEmbeddings(model="mxbai-embed-large")

    if os.path.exists(db_location):
        shutil.rmtree(db_location)

    vector_store = Chroma(
        collection_name="wikipedia_articles",
        persist_directory=db_location,
        embedding_function=embeddings
    )

    vector_store.add_documents(documents=documents)

    retriever = vector_store.as_retriever(search_kwargs={"k": 5})
    retrieved_docs = retriever.invoke(query)

    context = "\n".join([doc.page_content for doc in retrieved_docs])
    return context
