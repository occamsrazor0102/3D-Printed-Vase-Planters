import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { VaseParams } from '../vaseParams';
import { buildVaseGeometry } from './vaseMesh';

interface VasePreviewProps {
  params: VaseParams;
}

const VasePreview: React.FC<VasePreviewProps> = ({ params }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    mesh: THREE.Mesh;
    animId: number;
  } | null>(null);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const rotation = useRef({ x: -0.3, y: 0 });
  const [initError, setInitError] = React.useState<string | null>(null);

  // Initialise the Three.js scene once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 5000);
    camera.position.set(0, 150, 350);
    camera.lookAt(0, 100, 0);

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);
    } catch (error) {
      console.error('Failed to initialize WebGL renderer', error);
      setInitError('WebGL not supported or failed to initialize. Please check your graphics drivers or enable WebGL.');
      return;
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404060, 1.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(200, 300, 200);
    scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0x6080ff, 0.5);
    backLight.position.set(-200, 100, -200);
    scene.add(backLight);

    // Grid helper
    const gridHelper = new THREE.GridHelper(400, 20, 0x444466, 0x333355);
    scene.add(gridHelper);

    // Initial mesh
    const geometry = buildVaseGeometry(params);
    const material = new THREE.MeshPhongMaterial({
      color: 0xe07040,
      specular: 0x444444,
      shininess: 30,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Pivot group for rotation
    const pivot = new THREE.Group();
    pivot.add(mesh);
    scene.add(pivot);
    scene.remove(mesh);

    const animate = (): number => {
      pivot.rotation.x = rotation.current.x;
      pivot.rotation.y = rotation.current.y;
      renderer.render(scene, camera);
      return requestAnimationFrame(animate);
    };

    const animId = animate();

    sceneRef.current = { scene, camera, renderer, mesh, animId };

    // Handle resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Mouse drag for rotation
    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      rotation.current.y += dx * 0.01;
      rotation.current.x += dy * 0.01;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => {
      isDragging.current = false;
    };

    // Scroll zoom
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(50, Math.min(1000, camera.position.z + e.deltaY * 0.5));
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      if (renderer) {
        renderer.dispose();
        container.removeChild(renderer.domElement);
      }
    };
  }, []); // Only run on mount

  // Update geometry when params change
  useEffect(() => {
    if (!sceneRef.current) return;
    const { mesh } = sceneRef.current;
    const oldGeometry = mesh.geometry;
    mesh.geometry = buildVaseGeometry(params);
    oldGeometry.dispose();
  }, [params]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: 400,
        cursor: isDragging.current ? 'grabbing' : 'grab',
        position: 'relative',
        background: '#0f172a',
      }}
    >
      {initError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f87171',
            fontSize: 14,
            textAlign: 'center',
            padding: 24,
            background: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          {initError}
        </div>
      )}
    </div>
  );
};

export default VasePreview;
