# CaraML Playground

## Running

Frontend:
```
cd client
npm i
npm run dev
```

Backend:
```
cd server
npm i
npm run dev
```

## Deploying

Plan:
1. Frontend deployed on Github pages.
2. Backend deployed on any cloud Compute service, via Docker container for portability

## High-level flow:

1. Code is written in the web frontend, users can submit code to be compiled to LLVM IR and executed
2. Submit code to the /queue-compilation endpoint, with the source code and the "mode" (ir-only, run) (Note: maybe just have 1 mode initially)
3. Backend processing:
  - Backend calls caraml binary which is built into the Docker container, to compile the code to LLVM IR.
  - Backend calls Emscripten to compile the LLVM IR to WASM/JS so that user code is executable in the client.
  - Backend stores these in a tmp folder or a DB, can return when requested by client
4. Client can poll for compilation status, or can just await the initial request (assuming compilation time is reasonable)
5. Client fetches LLVM IR, JS loader, and WASM compiled code. Executes it in the browser and shows result to user.

# TODOs
- [ ] Set up backend to call into local caraml binary for compiling
- [ ] Figure out compiled code TTL and garbage collection job. Store in DB?
- [ ] Rate limiting, cost caps on cloud server
- [ ] deploy via IAC, terraform?
- [ ] lock down Postgres DB to be private vnet only
- [ ] Migrate workers to use event-based activation? Or cloud-native solution? (queue?)
- [ ] Move to WS/event-based mechanism for notifying the frontend about compilation updates (instead of polling)
- [ ] Set up Azure ManagedIdentities
- [ ] Lock down blob storage access to only via Managed Identity and vnet