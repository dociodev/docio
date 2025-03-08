FROM denoland/deno:2.2.3


WORKDIR /app

ADD . /app

RUN apt-get update -y && apt-get install -y openssl
RUN deno install --entrypoint apps/worker/main.ts

CMD ["task", "-r", "-f", "worker", "start"]