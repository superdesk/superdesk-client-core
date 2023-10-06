FROM python:3.10

ADD requirements.txt .
RUN pip3 install -U pip wheel setuptools
RUN pip3 install -r requirements.txt

WORKDIR /opt/superdesk
COPY . /opt/superdesk

EXPOSE 5000
EXPOSE 5100

ENTRYPOINT ["honcho"]
CMD ["start"]
