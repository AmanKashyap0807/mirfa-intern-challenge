# 04. Backend API

## The Server
Used **Fastify** in `apps/api/src/index.ts`. It's lightweight and strict.

## The Endpoints

### `POST /tx/encrypt`
This is the main entry point.
1.  **Validation**: I manually wrote `assertEncryptBody` instead of using a heavy validation library like Zod.
    *   *Why?* Zod is great, but for a microservice with effectively one schema, adding 100kb of dependencies felt bloated. `typeof x === 'string'` works fine here.
2.  **Action**: Encrypts payload -> Saves to Mongo.

### `GET /tx/history`
I added this endpoint to show mongoDB connection.
It will be removed before production as it is just added for the chellange.

### `POST /tx/:id/decrypt`
This is the danger zone.
*   It fetches the record.
*   It calls `decryptPayload`.
*   **Crucial Debugging Moment**: During testing, I had a build failure here. The `decryptPayload` function throws nice errors ("Failed to decrypt"), but my `handleError` wrapper in the API was originally swallowing them too aggressively. I had to ensure that `400 Bad Request` was returned for crypto failures (so the client knows why it failed) while keeping `500` for actual server crashes.

## Error Handling
I created a custom `AppError` class.
*   If I throw `new AppError(404, "Not Found")`, the client sees that.
*   If the code throws `ReferenceError: x is not defined`, the client sees `500 Internal Server Error`.
*   *Reasoning*: Never leak stack traces to the public. It gives attackers a roadmap of your code.
