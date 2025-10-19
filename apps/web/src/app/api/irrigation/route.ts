import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const greenhouseId = searchParams.get("greenhouseId");
    const type = searchParams.get("type");
    const limit = searchParams.get("limit");

    // Construir query string para o backend
    const queryParams = new URLSearchParams();
    if (greenhouseId) queryParams.append("greenhouseId", greenhouseId);
    if (type) queryParams.append("type", type);
    if (limit) queryParams.append("take", limit);

    // Fazer requisição para o backend NestJS (endpoint público)
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const response = await fetch(
      `${backendUrl}/test-irrigation?${queryParams.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching irrigations:", error);
    return NextResponse.json(
      { error: "Falha ao carregar irrigações" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Fazer requisição para o backend NestJS (endpoint público)
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const response = await fetch(`${backendUrl}/test-irrigation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `Backend responded with status: ${response.status}`
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating irrigation:", error);
    return NextResponse.json(
      { error: "Falha ao criar irrigação" },
      { status: 500 }
    );
  }
}
