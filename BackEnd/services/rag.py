import re


# =========================================================
# CLEAN TEXT
# =========================================================

def clean_text(text):

    if not text:

        return ""


    text = re.sub(
        r"\s+",
        " ",
        text
    )


    return text.strip()


# =========================================================
# CREATE CHUNKS
# =========================================================

def create_chunks(
    pages,
    words_per_chunk=180
):

    chunks = []

    chunk_id = 0


    for page in pages:

        page_number = page["page"]

        text = clean_text(
            page["text"]
        )


        if not text:

            continue


        words = text.split()


        for start in range(
            0,
            len(words),
            words_per_chunk
        ):

            chunk_words = words[
                start:start + words_per_chunk
            ]


            if not chunk_words:

                continue


            chunk_id += 1


            chunk_text = " ".join(
                chunk_words
            )


            chunks.append({

                "chunk_id": chunk_id,

                "page": page_number,

                "text": chunk_text

            })


    return chunks


# =========================================================
# FIND RELEVANT CHUNKS
# =========================================================

def find_relevant_chunks(
    question,
    chunks,
    max_chunks=3
):

    question_words = set(

        re.findall(

            r"\b[a-zA-Z0-9]+\b",

            question.lower()

        )

    )


    stop_words = {

        "what",
        "why",
        "how",
        "when",
        "where",
        "who",
        "which",
        "is",
        "are",
        "was",
        "were",
        "the",
        "a",
        "an",
        "of",
        "to",
        "in",
        "on",
        "for",
        "and",
        "or",
        "with",
        "does",
        "do",
        "can",
        "could",
        "would",
        "should",
        "explain",
        "tell",
        "me",
        "about"

    }


    question_words -= stop_words


    scored_chunks = []


    for chunk in chunks:

        chunk_words = set(

            re.findall(

                r"\b[a-zA-Z0-9]+\b",

                chunk["text"].lower()

            )

        )


        overlap = question_words.intersection(
            chunk_words
        )


        score = len(
            overlap
        )


        if score > 0:

            scored_chunks.append(

                (
                    score,
                    chunk
                )

            )


    scored_chunks.sort(

        key=lambda item: item[0],

        reverse=True

    )


    return [

        chunk

        for score, chunk
        in scored_chunks[:max_chunks]

    ]