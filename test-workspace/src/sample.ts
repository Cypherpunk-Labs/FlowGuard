export interface SampleData {
  id: string;
  name: string;
  value: number;
}

export function processData(data: SampleData): string {
  if (!data) {
    throw new Error('Data is required');
  }
  
  return `${data.name}: ${data.value}`;
}

export function validateData(data: SampleData): boolean {
  return !!data.id && !!data.name && typeof data.value === 'number';
}
