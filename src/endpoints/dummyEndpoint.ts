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

    const response = await fetch(
      "https://gettimeapi.dev/v1/time?timezone=UTC",
      {
        cf: {
          cacheEverything: true,
          cacheTtlByStatus: { "200-299": 16 * 60 },
        },
      }
    );
    // const response = await fetch("https://api.zonefestival.com/json/program/", {
    //   headers: { "Content-type": "application/x-www-form-urlencoded" },
    //   method: "POST",
    //   body: postBody,
    //   cf: {
    //     cacheTtlByStatus: { "200-299": 15 * 60 },
    //   },
    // });
    const responseData = await response.text();

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=600",
        Vary: "Accept-Encoding",
      },
    });
  }
}
