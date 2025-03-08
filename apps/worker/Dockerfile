FROM denoland/deno:2.2.3

WORKDIR /app

ADD . /app

RUN deno install --allow-scripts --entrypoint apps/worker/main.ts

CMD ["task", "-r", "-f", "worker", "start"]