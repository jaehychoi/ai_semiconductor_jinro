import { ReadingMaterial } from "../types";
import { INITIAL_READING_MATERIALS } from "../constants";

// Mock User interface to replace firebase/auth User since we removed the dependency
export interface User {
  uid: string;
  isAnonymous: boolean;
}

export const signIn = async (): Promise<User | null> => {
  return { uid: "mock-user", isAnonymous: true };
};

export const onUserChange = (callback: (user: User | null) => void) => {
  // No-op for mock
  return () => {};
};

// In-memory storage for the session
let memoryMaterials: ReadingMaterial[] = [...INITIAL_READING_MATERIALS];

export const fetchMaterials = async (): Promise<ReadingMaterial[]> => {
  // Simulate network delay slightly for realism
  await new Promise(resolve => setTimeout(resolve, 300));
  return [...memoryMaterials];
};

export const saveMaterial = async (material: ReadingMaterial): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = memoryMaterials.findIndex(m => m.id === material.id);
  if (index >= 0) {
    memoryMaterials[index] = material;
  } else {
    memoryMaterials.push(material);
  }
};

export const deleteMaterial = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  memoryMaterials = memoryMaterials.filter(m => m.id !== id);
};