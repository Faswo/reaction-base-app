export async function GET() {
  return Response.json({
    accountAssociation: {
      header: "",
      payload: "",
      signature: ""
    },
    miniapp: {
      version: "1",
      name: "Reaction Base App",
      iconUrl: "https://reaction-base-app.vercel.app/icon.png",
      homeUrl: "https://reaction-base-app.vercel.app",
      imageUrl: "https://reaction-base-app.vercel.app/icon.png",
      buttonTitle: "Open app",
      splashImageUrl: "https://reaction-base-app.vercel.app/icon.png",
      splashBackgroundColor: "#ffffff"
    }
  });
}