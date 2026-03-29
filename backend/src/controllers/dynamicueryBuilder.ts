import { QueryFilter, Model } from "mongoose";

interface SearchBody {
  key: string;
  value: unknown;
}

export function buildDynamicQuery<T>(
  model: Model<T>,
  body: SearchBody,
): QueryFilter<T> {
  const field = body.key;
  const value = body.value;

  const schemaPath = model.schema.path(field);

  if (!schemaPath) {
    throw new Error(`Unknown field: ${field}`);
  }

  let query: QueryFilter<T>;

  switch (schemaPath.instance) {
    case "String":
      query = {
        [field]: { $regex: String(value), $options: "i" },
      } as QueryFilter<T>;
      break;

    case "Number":
      if (typeof value === "object" && value !== null) {
        // supports range: { price: { $gte: 100, $lte: 300 } }
        query = { [field]: value } as QueryFilter<T>;
      } else {
        query = { [field]: Number(value) } as QueryFilter<T>;
      }
      break;

    case "Date":
      query = { [field]: new Date(value as string | number) } as QueryFilter<T>;
      break;

    case "Boolean":
      query = {
        [field]:
          value === true || value === "true" || value === 1 || value === "1",
      } as QueryFilter<T>;
      break;

    default:
      query = { [field]: value } as QueryFilter<T>;
  }

  return query;
}
