declare type template = {
    background: string;
    width: string;
    height: string;
    borderRadius: string;
    views: any;
};
declare const phl: (CanvasNode: object, canvas: CanvasRenderingContext2D, template: template, code: string, language: string) => void;
export default phl;
