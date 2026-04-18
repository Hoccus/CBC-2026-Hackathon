function redirectToApiAuth(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/auth/, "/api/auth");
  return Response.redirect(`${url.origin}${path}${url.search}`, 307);
}

export function GET(request: Request) {
  return redirectToApiAuth(request);
}

export function POST(request: Request) {
  return redirectToApiAuth(request);
}
