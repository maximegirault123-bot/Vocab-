// Teste la route de correction avec un faux client Claude : node tests/check.test.js
import assert from "node:assert";
import { Readable } from "node:stream";
import handler from "../api/check.js";

function fakeClient(reply) {
  const calls = [];
  return {
    calls,
    beta: { messages: { parse: async (params) => (calls.push(params), reply) } },
  };
}

async function call(body, client, method = "POST") {
  const req = Readable.from([JSON.stringify(body)]);
  req.method = method;
  const res = {
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    end(data) { this.body = data ? JSON.parse(data) : null; },
  };
  await handler(req, res, client);
  return res;
}

const correction = { verdict: "correct", feedback: "Bien vu.", suggestion: "" };

// Cas nominal : le mot et la définition viennent du lexique serveur, la phrase est encadrée.
{
  const client = fakeClient({ stop_reason: "end_turn", parsed_output: correction });
  const res = await call({ word: "Tergiverser", sentence: "Arrête de tergiverser, choisis !" }, client);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, correction);
  const params = client.calls[0];
  assert.equal(params.model, "claude-opus-5-5");
  assert.equal(params.fallbacks, "default");
  assert.match(params.messages[0].content, /User de détours/);
  assert.match(params.messages[0].content, /<phrase>Arrête de tergiverser, choisis !<\/phrase>/);
}

// Entrées refusées sans appeler l'API.
for (const [body, status] of [
  [{ word: "Inventé", sentence: "Une phrase." }, 400],
  [{ word: "Idoine", sentence: "   " }, 400],
  [{ word: "Idoine", sentence: "x".repeat(401) }, 400],
]) {
  const client = fakeClient(null);
  const res = await call(body, client);
  assert.equal(res.statusCode, status);
  assert.ok(res.body.error);
  assert.equal(client.calls.length, 0);
}

// Méthode non autorisée.
assert.equal((await call({}, fakeClient(null), "GET")).statusCode, 405);

// Refus du modèle et réponse non analysable.
assert.equal((await call({ word: "Idoine", sentence: "Ok." }, fakeClient({ stop_reason: "refusal", parsed_output: null }))).statusCode, 422);
assert.equal((await call({ word: "Idoine", sentence: "Ok." }, fakeClient({ stop_reason: "max_tokens", parsed_output: null }))).statusCode, 502);

console.log("OK — route de correction");
