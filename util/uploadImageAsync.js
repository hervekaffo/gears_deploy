import uploadToCloudinary from './uploadToCloudinary';

export default async function uploadImageAsync(uri, options) {
  const result = await uploadToCloudinary(uri, options);
  return result?.secure_url || result?.url;
}
