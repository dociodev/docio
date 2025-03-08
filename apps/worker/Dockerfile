FROM denoland/deno:2.2.3

WORKDIR /app

ADD . /app

RUN deno install --entrypoint apps/worker/main.ts

CMD ["task", "-r", "-f", "worker", "start"]