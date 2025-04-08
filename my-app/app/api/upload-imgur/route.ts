export async function POST(req: Request) {
    try {
      const { imageBase64 } = await req.json();
  
      const res = await fetch("https://api.imgur.com/3/image", {
        method: "POST",
        headers: {
          Authorization: "Client-ID 877c22f95bc6a35", // your client ID
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageBase64,
          type: "base64",
        }),
      });
  
      const data = await res.json();
      return new Response(JSON.stringify(data), { status: res.status });
    } catch (error) {
      console.error("Proxy upload error:", error);
      return new Response(JSON.stringify({ error: "Proxy failed" }), { status: 500 });
    }
  }
  