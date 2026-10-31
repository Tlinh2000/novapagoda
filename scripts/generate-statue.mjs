/** Model quét Happy Buddha: Stanford Computer Graphics Laboratory.
 * Bản OBJ giảm lưới được cung cấp qua Alec Jacobson/common-3d-test-models.
 * Dùng phi thương mại, ghi nguồn; xem THIRD_PARTY_NOTICES.md.
 * Chỉ đổi định dạng, đơn vị và vật liệu; tượng luôn tĩnh trong game.
 */
import * as T from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { readFile,writeFile } from 'node:fs/promises';
if(!globalThis.FileReader)globalThis.FileReader=class{
  readAsArrayBuffer(blob){blob.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}
};
const group=new OBJLoader().parse(await readFile(new URL('../source-assets/happy.obj',import.meta.url),'utf8'));
const box=new T.Box3().setFromObject(group),size=box.getSize(new T.Vector3());
let count=0;
group.traverse(o=>{
  if(!o.isMesh)return;
  o.geometry.deleteAttribute('normal');o.geometry.deleteAttribute('uv');
  o.geometry=mergeVertices(o.geometry,1e-7);o.geometry.computeVertexNormals();
  // Đổi đơn vị sang mét, chiều cao chính xác 1m để loader nhân theo config.
  o.geometry.translate(-box.getCenter(new T.Vector3()).x,-box.min.y,-box.getCenter(new T.Vector3()).z);
  o.geometry.scale(1/size.y,1/size.y,1/size.y);
  o.material=new T.MeshStandardMaterial({color:0xc99b4c,metalness:.58,roughness:.4});
  count+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;
});
group.name='HappyBuddha_Stanford';group.userData={source:'Stanford Computer Graphics Laboratory',authors:'Brian Curless, Marc Levoy',sourceUrl:'https://graphics.stanford.edu/data/3Dscanrep/',usage:'Free redistribution; non-commercial; retain source attribution.'};
const glb=await new GLTFExporter().parseAsync(group,{binary:true});
const output=new URL('../client/assets/models/buddha-detail.glb',import.meta.url);await writeFile(output,Buffer.from(glb));
console.log(JSON.stringify({bytes:glb.byteLength,triangles:count,output:output.pathname}));
