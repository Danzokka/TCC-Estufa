import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { irrigationId, type, waterAmount, notes, userId } = body;

    // Fazer requisição para o backend NestJS (endpoint público)
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const response = await fetch(
      `${backendUrl}/test-irrigation/${irrigationId}/confirm`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: type || "manual",
          waterAmount,
          notes,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `Backend responded with status: ${response.status}`
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error confirming irrigation:", error);
    return NextResponse.json(
      { error: "Falha ao confirmar irrigação" },
      { status: 500 }
    );
  }
}
