import * as mime from 'react-native-mime-types';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

const CLOUDINARY_CLOUD_NAME = 'du8trqcgt';
const CLOUDINARY_UPLOAD_PRESET = 'expo_profile';

export default async function uploadToCloudinary(
  uri,
  {
    folder,
    tags,
    context,
    publicId,
    timeoutMs = 30000,
    resourceType = 'auto',
  } = {}
) {
  assertConfig();

  const localUri = await ensureFileUri(uri);

  const { ext, mimeType } = inferMime(localUri);

  const fileName = buildFileName(publicId, ext);
  const formData = new FormData();
  formData.append('file', {
    uri: localUri,
    type: mimeType,
    name: fileName,
  });

  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  if (folder) formData.append('folder', folder);
  if (publicId) formData.append('public_id', publicId);
  if (Array.isArray(tags) && tags.length) formData.append('tags', tags.join(','));

  if (context && typeof context === 'object' && Object.keys(context).length) {
    const ctx = Object.entries(context)
      .map(([k, v]) => `${k}=${String(v)}`)
      .join('|');
    formData.append('context', ctx);
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

  let res;
  let json;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    json = await res.json();
  } catch (err) {
    clearTimeout(id);
    if (err?.name === 'AbortError') {
      throw new Error('Cloudinary upload timed out');
    }
    throw new Error(`Cloudinary upload failed: ${err?.message || String(err)}`);
  } finally {
    clearTimeout(id);
  }

  if (!res.ok) {
    const message =
      json?.error?.message ||
      json?.message ||
      `Cloudinary upload failed (${res.status})`;
    throw new Error(message);
  }

  return json;
}

function assertConfig() {
  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error('CLOUDINARY_CLOUD_NAME is missing.');
  }
  if (!CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('CLOUDINARY_UPLOAD_PRESET is missing.');
  }
}

async function ensureFileUri(uri) {
  if (uri.startsWith('file://')) return uri;

  const { ext } = inferMime(uri);
  const target = `${FileSystem.cacheDirectory}cldupload_${Date.now()}.${ext || 'bin'}`;

  try {
    if (
      uri.startsWith('content://') ||
      uri.startsWith('ph://') ||
      uri.startsWith('assets-library://')
    ) {
      await FileSystem.copyAsync({ from: uri, to: target });
      return target;
    }
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      const dl = await FileSystem.downloadAsync(uri, target);
      return dl.uri;
    }
  } catch (e) {
    const data = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    }).catch(() => null);
    if (data) {
      await FileSystem.writeAsStringAsync(target, data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return target;
    }
    throw new Error(`Could not access file: ${e?.message || String(e)}`);
  }

  const dl = await FileSystem.downloadAsync(uri, target);
  return dl.uri;
}

function inferMime(pathOrUri) {
  const match = pathOrUri.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
  const ext = (match ? match[1] : 'jpg').toLowerCase();

  const normalizedExt =
    (ext === 'heic' || ext === 'heif') && Platform.OS === 'ios' ? 'jpg' : ext;

  let mimeType = mime.lookup(ext) || `application/octet-stream`;

  if (mimeType === 'application/octet-stream') {
    if (/\/image\//i.test(pathOrUri) || /\.(png|jpe?g|gif|webp|bmp|tiff)$/i.test(pathOrUri)) {
      mimeType = 'image/' + (normalizedExt === 'jpg' ? 'jpeg' : normalizedExt);
    } else if (/\/video\//i.test(pathOrUri) || /\.(mp4|mov|webm|avi|mkv)$/i.test(pathOrUri)) {
      mimeType = 'video/' + normalizedExt;
    }
  }

  return { ext: normalizedExt, mimeType };
}

function buildFileName(publicId, ext) {
  if (publicId) {
    const sanitized = String(publicId).replace(/[^\w\-/]/g, '_');
    return sanitized.endsWith(`.${ext}`) ? sanitized : `${sanitized}.${ext}`;
  }
  return `upload_${Date.now()}.${ext}`;
}
