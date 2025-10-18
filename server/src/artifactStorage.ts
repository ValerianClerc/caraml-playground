import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

export interface IArtifactStorage {
  getArtifactStream(artifactPath: string): Promise<NodeJS.ReadableStream | undefined>;
}

class AzureBlobArtifactStorage implements IArtifactStorage {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;

  constructor() {

    const credential = new DefaultAzureCredential();
    const blobServiceClient = new BlobServiceClient(
      `https://caramlblob.blob.core.windows.net`,
      credential
    );
    this.blobServiceClient = blobServiceClient;
    this.containerClient = blobServiceClient.getContainerClient('artifacts');
  }

  async getArtifactStream(artifactPath: string): Promise<NodeJS.ReadableStream | undefined> {
    const blobClient = this.containerClient.getBlobClient(artifactPath);
    const exists = await blobClient.exists();
    if (!exists) {
      console.warn(`Artifact blob does not exist at path: ${artifactPath}`);
      return undefined;
    }
    const downloadBlockBlobResponse = await blobClient.download();
    return downloadBlockBlobResponse.readableStreamBody;
  }
}

export const artifactStorage: IArtifactStorage = new AzureBlobArtifactStorage();