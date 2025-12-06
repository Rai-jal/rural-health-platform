import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";

// POST - Upload document/file
export async function POST(request: Request) {
  const { user, profile, error } = await authGuard({ requiredRole: "Admin" });

  if (error) {
    return error;
  }

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string || "admin-documents";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("admin-documents")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      // If bucket doesn't exist, return instructions
      if (uploadError.message.includes("Bucket not found")) {
        return NextResponse.json(
          {
            error: "Storage bucket not found",
            message:
              "Please create a storage bucket named 'admin-documents' in Supabase Storage",
          },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: uploadError.message || "Failed to upload file" },
        { status: 400 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("admin-documents").getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      file: {
        path: filePath,
        url: publicUrl,
        name: file.name,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

