import { action } from "./_generated/server";
import { v } from "convex/values";

export const uploadDoctorPhoto = action({
  args: {
    contentType: v.string(),
    file: v.bytes(),
  },
  handler: async (ctx, args) => {
    // Convert ArrayBuffer to Blob
    const blob = new Blob([args.file]);
    const storageId = await ctx.storage.store(blob);
    const url = await ctx.storage.getUrl(storageId);
    return url;
  },
});
