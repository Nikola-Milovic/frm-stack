import { orpc } from "#orpc";

export const authOnly = orpc.middleware(async ({ context, next, errors }) => {
  if (!context.user || !context.session) {
    throw errors.UNAUTHORIZED();
  }

  return next({
    context: {
      user: context.user,
      session: context.session,
    },
  });
});

export const notBanned = orpc.middleware(async ({ context, next, errors }) => {
  if (!context.user || !context.session) {
    throw errors.UNAUTHORIZED();
  }

  if (context.user.banned) {
    throw errors.FORBIDDEN({
      message:
        "Your account is restricted from making purchases and deposits. Please contact support@yourcompany.io for more information.",
    });
  }

  return next({
    context: {
      user: context.user,
      session: context.session,
    },
  });
});
