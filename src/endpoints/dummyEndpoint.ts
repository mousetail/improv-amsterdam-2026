import { contentJson, OpenAPIRoute } from "chanfana";
import { AppContext } from "../types";
import { z } from "zod";

export class DummyEndpoint extends OpenAPIRoute {
  public schema = {
    tags: ["Dummy"],
    summary: "this endpoint is an example",
    operationId: "example-endpoint", // This is optional
    request: {},
    responses: {
      "200": {
        description: "Returns the log details",
        ...contentJson({
          success: Boolean,
          result: z.object({
            msg: z.string(),
            slug: z.string(),
            name: z.string(),
          }),
        }),
      },
    },
  };
  public async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();

    const response = await fetch("https://api.tickettailor.com/v1/events", {
      headers: {
        Authorization: "Basic " + btoa(c.env.TICKETTAILOR_API_KEY + ":"),
      },
      cf: {
        cacheEverything: true,
        cacheTtlByStatus: { "200-299": 16 * 60 },
      },
    });
    const rateLimit = response.headers.get("X-Rate-Limit-Limit");
    const rateLimitRemaining = response.headers.get("X-Rate-Limit-Remaining");
    const rateLimitReset = response.headers.get("X-Rate-Limit-Reset");
    const responseData: { rateLimit: {} } = await response.json();

    responseData["rateLimit"] = {
      rateLimit,
      rateLimitRemaining,
      rateLimitReset,
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=600",
        Vary: "Accept-Encoding",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
    });
  }
}
