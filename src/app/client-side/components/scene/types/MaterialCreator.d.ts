import { Material, Texture, Vector2 } from 'three';

export class MaterialCreator {
    constructor(baseUrl: string, options?: MaterialCreatorOptions);

    // Свойства
    baseUrl: string;
    options: MaterialCreatorOptions;
    materialsInfo: { [name: string]: MaterialInfo };
    materials: { [name: string]: Material };
    materialsArray: Material[];
    nameLookup: { [name: string]: string };

    // Методы
    setCrossOrigin(value: string): this;
    setManager(value: any): this;
    setMaterials(materialsInfo: { [name: string]: MaterialInfo }): this;
    convert(materialsInfo: { [name: string]: MaterialInfo }): { [name: string]: MaterialInfo };
    preload(): this;
    getIndex(materialName: string): number;
    getAsArray(): Material[];
    create(materialName: string): Material;
    createMaterial_(materialName: string): Material;
    getTextureParams(url: string, materialParams: any): { [key: string]: any };
    loadTexture(url: string, mapping?: any, onLoad?: (texture: Texture) => void, onError?: (error: ErrorEvent) => void): Texture;
}

// Дополнительные интерфейсы
export interface MaterialCreatorOptions {
    side?: number;
    wrap?: number;
    normalizeRGB?: boolean;
    ignoreZeroRGBs?: boolean;
    invertTrProperty?: boolean;
}

export interface MaterialInfo {
    kd?: number[]; // Diffuse color
    ka?: number[]; // Ambient color
    ks?: number[]; // Specular color
    ke?: number[]; // Emissive color
    map_kd?: string; // Diffuse map
    map_ks?: string; // Specular map
    map_ke?: string; // Emissive map
    norm?: string; // Normal map
    bump?: string; // Bump map
    disp?: string; // Displacement map
    map_bump?: string; // Alias for bump
    opacity?: number;
    transparent?: boolean;
    shininess?: number;
    [key: string]: any; // Позволяет дополнительные свойства
}
