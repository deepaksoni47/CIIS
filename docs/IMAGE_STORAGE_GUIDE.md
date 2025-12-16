# Image Storage Strategy for CIIS

## Storage Solution: Firebase Storage ✅

### Why Firebase Storage?

1. **No Billing Required** - Works on Spark (free) plan
2. **5GB Storage** - Sufficient for university scale
3. **Integrated with Firebase** - Same ecosystem as Firestore
4. **Automatic CDN** - Fast global delivery
5. **Security Rules** - Control who uploads/accesses images

---

## Storage Capacity Analysis

### Free Tier Limits

```
Firebase Storage (Spark Plan):
- Storage: 5GB
- Downloads: 1GB/day
- Uploads: 20,000/day
```

### Real-World Capacity

```
Typical Issue Photo Sizes:
- Original phone photo: 2-3MB
- Compressed (80% quality): 500KB
- Thumbnail: 50KB

5GB Storage Breakdown:
- Original photos: ~2,500 images
- Compressed photos: ~10,000 images ✅
- With thumbnails: ~5,000 issues with photos

For Reference:
- Small campus (2,000 students): 200-400 issues/year
- Medium campus (5,000 students): 500-1,000 issues/year
- GGV campus: ~10,000 students → ~1,000-2,000 issues/year

5GB = 5+ years of issue photos!
```

---

## Implementation Plan

### 1. Firebase Storage Structure

```
gs://ciis-2882b.appspot.com/
└── organizations/
    └── ggv-bilaspur/
        └── issues/
            └── {issueId}/
                ├── original/
                │   └── image_1.jpg
                ├── compressed/
                │   └── image_1.jpg
                └── thumbnails/
                    └── image_1.jpg
```

### 2. Upload Process (Frontend)

```typescript
// React component
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

async function uploadIssueImage(
  file: File,
  issueId: string,
  organizationId: string
) {
  // 1. Compress image (client-side)
  const compressed = await compressImage(file, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
  });

  // 2. Upload to Firebase Storage
  const path = `organizations/${organizationId}/issues/${issueId}/compressed/${file.name}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, compressed);

  // 3. Get download URL
  const downloadURL = await getDownloadURL(storageRef);

  return downloadURL;
}

// Compression helper
async function compressImage(file: File, options: any): Promise<Blob> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        // Calculate dimensions
        let { width, height } = img;
        if (width > options.maxWidth) {
          height *= options.maxWidth / width;
          width = options.maxWidth;
        }
        if (height > options.maxHeight) {
          width *= options.maxHeight / height;
          height = options.maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", options.quality);
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}
```

### 3. Upload Process (Backend)

```typescript
// backend/src/modules/issues/upload.service.ts
import * as admin from "firebase-admin";

export async function uploadImageFromURL(
  imageUrl: string,
  issueId: string,
  organizationId: string
): Promise<string> {
  const bucket = admin.storage().bucket();
  const fileName = `organizations/${organizationId}/issues/${issueId}/image_${Date.now()}.jpg`;
  const file = bucket.file(fileName);

  // Fetch image
  const response = await fetch(imageUrl);
  const buffer = await response.buffer();

  // Upload to Firebase Storage
  await file.save(buffer, {
    metadata: {
      contentType: "image/jpeg",
      metadata: {
        issueId,
        organizationId,
        uploadedAt: new Date().toISOString(),
      },
    },
  });

  // Make publicly readable (or use signed URLs)
  await file.makePublic();

  // Return public URL
  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
}
```

### 4. Security Rules

```javascript
// Firebase Storage Rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Organization-scoped access
    match /organizations/{orgId}/issues/{issueId}/{allPaths=**} {
      // Allow authenticated users from same org to read
      allow read: if request.auth != null &&
                     firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.organizationId == orgId;

      // Allow authenticated users to upload (max 5MB)
      allow write: if request.auth != null &&
                      request.resource.size < 5 * 1024 * 1024 &&
                      request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

## API Endpoints

### Upload Image Endpoint

```typescript
// POST /api/issues/upload-image
import { Request, Response } from "express";
import multer from "multer";
import * as admin from "firebase-admin";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images allowed"));
    }
  },
});

export async function uploadIssueImage(req: Request, res: Response) {
  try {
    const { organizationId, issueId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const bucket = admin.storage().bucket();
    const fileName = `organizations/${organizationId}/issues/${issueId}/${Date.now()}_${
      file.originalname
    }`;
    const fileRef = bucket.file(fileName);

    await fileRef.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
    });

    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Optional: Analyze with Gemini Vision
    const analysis = await analyzeIssueImage(publicUrl);

    res.json({
      success: true,
      data: {
        url: publicUrl,
        fileName,
        size: file.size,
        aiAnalysis: analysis,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Route
import express from "express";
const router = express.Router();
router.post("/upload-image", upload.single("image"), uploadIssueImage);
```

---

## Frontend Implementation

### Issue Submission Form with Image Upload

```typescript
// components/IssueSubmissionForm.tsx
import { useState } from "react";
import { uploadIssueImage } from "@/lib/firebase-storage";
import { analyzeIssueImage } from "@/lib/api";

export function IssueSubmissionForm() {
  const [images, setImages] = useState<File[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(files);

    // Auto-analyze first image
    if (files.length > 0) {
      setLoading(true);
      try {
        const tempUrl = URL.createObjectURL(files[0]);
        const analysis = await analyzeIssueImage(tempUrl);
        setAiAnalysis(analysis);

        // Auto-fill form
        setFormData({
          description: analysis.description,
          category: analysis.suggestedCategory,
          severity: analysis.severity,
        });
      } catch (error) {
        console.error("Analysis failed:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Upload images to Firebase Storage
    const imageUrls = await Promise.all(
      images.map((img) => uploadIssueImage(img, issueId, orgId))
    );

    // Create issue with image URLs
    await createIssue({
      ...formData,
      images: imageUrls,
      aiImageAnalysis: aiAnalysis?.description,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
      />

      {loading && <p>🤖 AI analyzing image...</p>}

      {aiAnalysis && (
        <div className="ai-suggestion">
          <h3>AI Analysis:</h3>
          <p>{aiAnalysis.description}</p>
          <p>Severity: {aiAnalysis.severity}/10</p>
          <p>Category: {aiAnalysis.suggestedCategory}</p>
        </div>
      )}

      {/* Rest of form fields */}
    </form>
  );
}
```

---

## Image Optimization Tips

### 1. Client-Side Compression

```bash
npm install browser-image-compression
```

```typescript
import imageCompression from "browser-image-compression";

async function compressImage(file: File) {
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };
  return await imageCompression(file, options);
}
```

### 2. Generate Thumbnails (Backend)

```typescript
import sharp from "sharp";

async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  return await sharp(buffer)
    .resize(300, 300, { fit: "inside" })
    .jpeg({ quality: 80 })
    .toBuffer();
}
```

### 3. Lazy Loading (Frontend)

```typescript
<img
  src={thumbnailUrl}
  data-full={fullImageUrl}
  loading="lazy"
  onClick={(e) => {
    e.target.src = e.target.dataset.full;
  }}
/>
```

---

## Alternative: Cloudinary (If Needed)

**Only use if you exceed 5GB or need advanced features:**

### Cloudinary Free Tier

- 25GB storage
- 25GB bandwidth/month
- Automatic optimization
- Image transformations

### Setup

```bash
npm install cloudinary
```

```typescript
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload
const result = await cloudinary.uploader.upload(file.path, {
  folder: "ciis/issues",
  transformation: [
    { width: 1920, crop: "limit" },
    { quality: "auto" },
    { fetch_format: "auto" },
  ],
});

return result.secure_url;
```

**Note:** Cloudinary may require credit card verification even for free tier.

---

## Monitoring Storage Usage

### Check Firebase Storage Usage

```bash
# Firebase Console → Storage → Usage tab
# Or via CLI:
firebase projects:list
```

### Set up Alerts

```javascript
// Cloud Function to monitor storage
export const monitorStorage = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async () => {
    const [files] = await bucket.getFiles();
    const totalSize = files.reduce((sum, file) => sum + file.metadata.size, 0);
    const totalGB = totalSize / 1024 ** 3;

    if (totalGB > 4) {
      // Send alert - approaching 5GB limit
      console.warn(`Storage usage: ${totalGB.toFixed(2)}GB / 5GB`);
    }
  });
```

---

## Decision Matrix

| Factor                | Firebase Storage | Cloudinary       |
| --------------------- | ---------------- | ---------------- |
| **Storage**           | 5GB              | 25GB             |
| **Billing**           | ✅ No billing    | ⚠️ May need card |
| **Integration**       | ✅ Native        | ❌ External      |
| **Optimization**      | Manual           | ✅ Automatic     |
| **CDN**               | ✅ Included      | ✅ Included      |
| **Cost (after free)** | $0.026/GB        | Varies           |

**Recommendation:** Start with **Firebase Storage**. Migrate to Cloudinary only if you:

1. Exceed 5GB regularly
2. Need advanced image transformations
3. Have budget for paid tiers

---

## Summary

✅ **Use Firebase Storage** - 5GB is plenty for university scale  
✅ **Compress images** client-side (~500KB each = 10,000 images)  
✅ **Gemini Vision** works with Firebase Storage URLs  
✅ **No billing required** - Stays within free tier  
⚠️ **Monitor usage** - Set alerts at 4GB

**Next Step:** Implement image upload endpoint in Issues module
