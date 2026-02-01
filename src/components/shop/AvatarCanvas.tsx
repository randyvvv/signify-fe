"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { Suspense } from "react";
import { ShopItem } from "./data";

interface AvatarCanvasProps {
  equippedItems: Record<string, ShopItem | null>;
}

// TODO: Replace this placeholder component with actual GLTF model loading using useGLTF
// Example: const { nodes, materials } = useGLTF('/models/avatar.glb')
// Ensure you have valid .glb/.gltf models in your public folder to load them.
function PlaceholderAvatar({ equippedItems }: { equippedItems: Record<string, ShopItem | null> }) {
  const eyeColor = equippedItems["Eye Color"]?.color || "#000000";
  const hairType = equippedItems["Hair"]?.name;
  const accessory = equippedItems["Accessories"]?.name;
  
  return (
    <group position={[0, -1, 0]}>
        {/* Head */}
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial color="#f0c0a0" />
        </mesh>
        
        {/* Eyes */}
        <mesh position={[-0.2, 1.6, 0.45]} castShadow>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[0.2, 1.6, 0.45]} castShadow>
             <sphereGeometry args={[0.08, 16, 16]} />
             <meshStandardMaterial color="white" />
        </mesh>
        {/* Pupils */}
        <mesh position={[-0.2, 1.6, 0.51]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial color={eyeColor} />
        </mesh>
        <mesh position={[0.2, 1.6, 0.51]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial color={eyeColor} />
        </mesh>

        {/* Smile */}
        <mesh position={[0, 1.35, 0.45]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.1, 0.02, 16, 32, Math.PI]} />
            <meshStandardMaterial color="#a05040" />
            <group rotation={[Math.PI, 0, 0]} /> 
        </mesh>
        {/* NOTE: Torus arc is tricky, simplified mouth for placeholder */}

        {/* Body */}
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
           <capsuleGeometry args={[0.45, 1.2, 4, 8]} />
           <meshStandardMaterial color="#3b82f6" />
        </mesh>

        {/* Arms */}
        <mesh position={[-0.6, 0.8, 0]} rotation={[0, 0, 0.2]} castShadow>
            <capsuleGeometry args={[0.12, 1, 4, 8]} />
            <meshStandardMaterial color="#f0c0a0" />
        </mesh>
        <mesh position={[0.6, 1.6, 0.3]} rotation={[1.5, 0, -0.5]} castShadow>
             {/* Waving arm */}
             <capsuleGeometry args={[0.12, 1, 4, 8]} />
             <meshStandardMaterial color="#f0c0a0" />
        </mesh>


        {/* Hair Logic - Placeholder shapes */}
        {hairType === "Bun" ? (
             <mesh position={[0, 2.05, -0.1]} castShadow>
                <sphereGeometry args={[0.35, 32, 32]} />
                <meshStandardMaterial color="#4A3020" />
             </mesh>
        ) : hairType === "Braids" ? (
             <group>
                <mesh position={[-0.5, 1.3, 0]} rotation={[0,0,0.2]} castShadow>
                   <cylinderGeometry args={[0.1, 0.15, 1.2]} />
                   <meshStandardMaterial color="#B06030" />
                </mesh>
                 <mesh position={[0.5, 1.3, 0]} rotation={[0,0,-0.2]} castShadow>
                   <cylinderGeometry args={[0.1, 0.15, 1.2]} />
                   <meshStandardMaterial color="#B06030" />
                </mesh>
                 <mesh position={[0, 1.9, 0]} castShadow>
                     <sphereGeometry args={[0.52, 32, 32]} />
                     <meshStandardMaterial color="#B06030" />
                 </mesh>
             </group>
        ) : (
             // Default hair/Other
             <mesh position={[0, 1.9, 0]} castShadow>
                 <sphereGeometry args={[0.52, 32, 32]} />
                 <meshStandardMaterial color="#222" />
             </mesh>
        )}
        
         {/* Accessories Logic */}
         {accessory === "Glasses" && (
             <group position={[0, 1.6, 0.45]}>
                <mesh position={[-0.2, 0, 0]}>
                    <ringGeometry args={[0.08, 0.12, 32]} />
                    <meshStandardMaterial color="#111" />
                </mesh>
                 <mesh position={[0.2, 0, 0]}>
                    <ringGeometry args={[0.08, 0.12, 32]} />
                     <meshStandardMaterial color="#111" />
                </mesh>
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[0.2, 0.02, 0.01]} />
                    <meshStandardMaterial color="#111" />
                </mesh>
             </group>
         )}
          {accessory === "Hat" && (
             <group position={[0, 2.0, 0]}>
                 <mesh position={[0, 0, 0]}>
                     <cylinderGeometry args={[0.6, 0.6, 0.05]} />
                     <meshStandardMaterial color="#333" />
                 </mesh>
                 <mesh position={[0, 0.2, 0]}>
                      <cylinderGeometry args={[0.35, 0.35, 0.4]} />
                      <meshStandardMaterial color="#333" />
                 </mesh>
             </group>
         )}
    </group>
  );
}

export default function AvatarCanvas({ equippedItems }: AvatarCanvasProps) {
  // Parsing background color or default
  const bgColor = equippedItems["Background"]?.color || "#eef2ff";

  return (
    <div className="h-[500px] lg:h-full w-full relative rounded-2xl overflow-hidden transition-colors duration-500 ease-in-out" style={{ backgroundColor: bgColor }}>
      <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }} shadows>
        <Suspense fallback={null}>
            <ambientLight intensity={0.6} />
            <spotLight position={[5, 10, 5]} angle={0.25} penumbra={1} intensity={1} castShadow />
            <directionalLight position={[-5, 5, 5]} intensity={0.5} />
            <Environment preset="city" />
            
            <PlaceholderAvatar equippedItems={equippedItems} />
            
            <ContactShadows position={[0, -1, 0]} opacity={0.4} scale={10} blur={2} far={4} color="#000" />
            <OrbitControls 
                minPolarAngle={Math.PI / 3} 
                maxPolarAngle={Math.PI / 1.8} 
                minAzimuthAngle={-Math.PI / 4}
                maxAzimuthAngle={Math.PI / 4}
                enableZoom={false} 
                enablePan={false}
            />
        </Suspense>
      </Canvas>
    </div>
  );
}
