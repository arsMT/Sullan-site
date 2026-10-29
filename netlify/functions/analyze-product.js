
export default async (request) => {
  if (request.method !== "POST") {
    return Response.json(
      { error: "Méthode non autorisée" },
      { status: 405 }
    );
  }

  try {
    const { image } = await request.json();

    if (!image || !image.startsWith("data:image/")) {
      return Response.json(
        { error: "Photo invalide" },
        { status: 400 }
      );
    }

    const apiKey = Netlify.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      return Response.json(
        { error: "Clé API non configurée" },
        { status: 503 }
      );
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          input: [{
            role: "user",
            content: [
              {
                type: "input_text",
                text: "Identifie le produit capillaire visible. Réponds en français avec la marque, le nom, le type de produit et son utilisation. Signale toute incertitude."
              },
              {
                type: "input_image",
                image_url: image
              }
            ]
          }]
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: "Analyse IA indisponible" },
        { status: 502 }
      );
    }

    const analysis = (result.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n");

    return Response.json({ analysis });
  } catch (error) {
    return Response.json(
      { error: "Impossible d'analyser la photo" },
      { status: 500 }
    );
  }
};
