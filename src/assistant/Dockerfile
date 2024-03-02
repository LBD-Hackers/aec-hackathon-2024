FROM python:3.9

WORKDIR /code
 
COPY ./api/requirements.txt /code/requirements.txt

RUN pip install --upgrade pip
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt
 
COPY ./api /code/app
 
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80"]
# CMD exec /bin/bash -c "trap : TERM INT; sleep infinity & wait"