'use client'

import { useRef, useEffect, useState } from 'react'
import { useEditorStore } from '@/lib/store'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/lib/types'

export default function EditorCanvas() {
  const [isMounted, setIsMounted] = useState(false)
  const [Konva, setKonva] = useState<any>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    // Dynamically import react-konva only on client side
    import('react-konva').then((module) => {
      setKonva(module)
      setIsMounted(true)
    })
  }, [])
  
  // Calculate container size and scale to fit
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const container = containerRef.current
        const rect = container.getBoundingClientRect()
        setContainerSize({
          width: rect.width,
          height: rect.height,
        })
      }
    }
    
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])
  
  const { 
    presentation, 
    currentSlideIndex, 
    selectedElementId,
    setSelectedElementId,
    updateElement,
  } = useEditorStore()
  
  const stageRef = useRef(null)
  
  if (!isMounted || !Konva) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-muted">Loading canvas...</div>
      </div>
    )
  }
  
  const { Stage, Layer, Rect, Text, Group, Image: KonvaImage } = Konva
  
  // Safe access with fallback
  if (!presentation || !presentation.slides_json?.slides || !presentation.slides_json.slides[currentSlideIndex]) {
    return null
  }
  
  const currentSlide = presentation.slides_json.slides[currentSlideIndex]
  
  // Calculate scale to fit canvas in viewport without horizontal scroll
  // Add padding to account for container margins
  const availableWidth = containerSize.width - 32 // Account for padding
  const availableHeight = containerSize.height - 32
  
  const scaleX = availableWidth > 0 ? availableWidth / CANVAS_WIDTH : 0.5
  const scaleY = availableHeight > 0 ? availableHeight / CANVAS_HEIGHT : 0.5
  const scale = Math.min(scaleX, scaleY, 1) // Never scale up, only down
  
  const scaledWidth = CANVAS_WIDTH * scale
  const scaledHeight = CANVAS_HEIGHT * scale
  
  // Render background with gradient support and grain overlay
  function renderBackground() {
    const { background } = currentSlide
    
    const bgElements = []
    
    // Main background
    if (background.type === 'gradient' && background.gradient) {
      const { colors, angle = 135 } = background.gradient
      
      // Convert angle to Konva gradient points
      const angleRad = (angle - 90) * (Math.PI / 180)
      const centerX = CANVAS_WIDTH / 2
      const centerY = CANVAS_HEIGHT / 2
      const length = Math.max(CANVAS_WIDTH, CANVAS_HEIGHT)
      
      const startX = centerX - Math.cos(angleRad) * length / 2
      const startY = centerY - Math.sin(angleRad) * length / 2
      const endX = centerX + Math.cos(angleRad) * length / 2
      const endY = centerY + Math.sin(angleRad) * length / 2
      
      bgElements.push(
        <Rect
          key="gradient"
          x={0}
          y={0}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          fillLinearGradientStartPoint={{ x: startX, y: startY }}
          fillLinearGradientEndPoint={{ x: endX, y: endY }}
          fillLinearGradientColorStops={[
            0, colors[0] || '#667eea',
            1, colors[1] || colors[0] || '#764ba2'
          ]}
        />
      )
    } else if (background.type === 'solid' && background.solid) {
      bgElements.push(
        <Rect
          key="solid"
          x={0}
          y={0}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          fill={background.solid.color}
        />
      )
    } else {
      // Default background
      bgElements.push(
        <Rect
          key="default"
          x={0}
          y={0}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          fill="#0B0D0F"
        />
      )
    }
    
    // Add grain/noise overlay
    bgElements.push(
      <Rect
        key="grain"
        x={0}
        y={0}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        fillPatternImage={createGrainPattern()}
        opacity={0.08}
      />
    )
    
    return bgElements
  }
  
  // Create grain pattern
  function createGrainPattern() {
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 200
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined
    
    const imageData = ctx.createImageData(200, 200)
    for (let i = 0; i < imageData.data.length; i += 4) {
      const noise = Math.random() * 255
      imageData.data[i] = noise
      imageData.data[i + 1] = noise
      imageData.data[i + 2] = noise
      imageData.data[i + 3] = 255
    }
    ctx.putImageData(imageData, 0, 0)
    
    const img = new window.Image()
    img.src = canvas.toDataURL()
    return img
  }
  
  // Render elements with full support for images, blobs, and shapes
  function renderElement(element: any, index: number) {
    const isSelected = element.id === selectedElementId
    
    // Render text elements
    if (element.type === 'text') {
      return (
        <Group
          key={element.id}
          draggable
          x={element.props.x}
          y={element.props.y}
          onDragEnd={(e: any) => {
            updateElement(currentSlideIndex, element.id, {
              props: {
                ...element.props,
                x: e.target.x(),
                y: e.target.y(),
              },
            })
          }}
          onClick={() => setSelectedElementId(element.id)}
        >
          <Rect
            width={element.props.width}
            height={element.props.height}
            stroke={isSelected ? '#89C2FF' : 'transparent'}
            strokeWidth={2}
            dash={isSelected ? [5, 5] : []}
          />
          <Text
            text={element.content || ''}
            fontSize={element.style?.fontSize || 36}
            fontFamily={element.style?.fontFamily || 'Inter'}
            fill={element.style?.fill || '#111111'}
            align={element.style?.align || 'left'}
            width={element.props.width}
            height={element.props.height}
            verticalAlign="middle"
          />
        </Group>
      )
    }
    
    // Render image elements
    if (element.type === 'image' && element.content) {
      return (
        <ImageElement
          key={element.id}
          element={element}
          isSelected={isSelected}
          onSelect={() => setSelectedElementId(element.id)}
          onDragEnd={(x: number, y: number) => {
            updateElement(currentSlideIndex, element.id, {
              props: { ...element.props, x, y },
            })
          }}
        />
      )
    }
    
    // Render shapes (including blobs with SVG)
    if (element.type === 'shape') {
      // Check if this is a blob with SVG data
      if (element.content && typeof element.content === 'string' && element.content.includes('<svg')) {
        return (
          <BlobElement
            key={element.id}
            element={element}
            isSelected={isSelected}
            onSelect={() => setSelectedElementId(element.id)}
            onDragEnd={(x: number, y: number) => {
              updateElement(currentSlideIndex, element.id, {
                props: { ...element.props, x, y },
              })
            }}
          />
        )
      }
      
      // Regular shape (rectangle/circle)
      const isCircle = element.style?.radius && element.props.width === element.props.height
      return (
        <Rect
          key={element.id}
          x={element.props.x}
          y={element.props.y}
          width={element.props.width}
          height={element.props.height}
          fill={element.style?.fill || '#FFFFFF'}
          cornerRadius={isCircle ? element.props.width / 2 : (element.style?.radius || 0)}
          rotation={element.props.rotation || 0}
          opacity={element.props.opacity || 0.3}
          draggable
          onClick={() => setSelectedElementId(element.id)}
          onDragEnd={(e: any) => {
            updateElement(currentSlideIndex, element.id, {
              props: {
                ...element.props,
                x: e.target.x(),
                y: e.target.y(),
              },
            })
          }}
        />
      )
    }
    
    // Render rectangle elements
    if (element.type === 'rect') {
      return (
        <Rect
          key={element.id}
          x={element.props.x}
          y={element.props.y}
          width={element.props.width}
          height={element.props.height}
          fill={element.style?.fill || '#FFFFFF'}
          cornerRadius={element.style?.radius || 0}
          rotation={element.props.rotation || 0}
          opacity={element.props.opacity || 1}
          draggable
          onClick={() => setSelectedElementId(element.id)}
          onDragEnd={(e: any) => {
            updateElement(currentSlideIndex, element.id, {
              props: {
                ...element.props,
                x: e.target.x(),
                y: e.target.y(),
              },
            })
          }}
        />
      )
    }
    
    return null
  }
  
  // Helper component to render images
  function ImageElement({ element, isSelected, onSelect, onDragEnd }: any) {
    const [image, setImage] = useState<HTMLImageElement | null>(null)
    
    useEffect(() => {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.src = element.content
      img.onload = () => setImage(img)
    }, [element.content])
    
    if (!image) return null
    
    return (
      <Group
        draggable
        x={element.props.x}
        y={element.props.y}
        onClick={onSelect}
        onDragEnd={(e: any) => onDragEnd(e.target.x(), e.target.y())}
      >
        <Rect
          width={element.props.width}
          height={element.props.height}
          stroke={isSelected ? '#89C2FF' : 'transparent'}
          strokeWidth={3}
          dash={isSelected ? [5, 5] : []}
        />
        <KonvaImage
          image={image}
          width={element.props.width}
          height={element.props.height}
          cornerRadius={8}
        />
      </Group>
    )
  }
  
  // Helper component to render blobs from SVG
  function BlobElement({ element, isSelected, onSelect, onDragEnd }: any) {
    const [image, setImage] = useState<HTMLImageElement | null>(null)
    
    useEffect(() => {
      // Convert SVG string to image
      const svgBlob = new Blob([element.content], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(svgBlob)
      
      const img = new window.Image()
      img.src = url
      img.onload = () => {
        setImage(img)
        URL.revokeObjectURL(url)
      }
      
      return () => URL.revokeObjectURL(url)
    }, [element.content])
    
    if (!image) return null
    
    return (
      <Group
        draggable
        x={element.props.x}
        y={element.props.y}
        onClick={onSelect}
        onDragEnd={(e: any) => onDragEnd(e.target.x(), e.target.y())}
      >
        <KonvaImage
          image={image}
          width={element.props.width}
          height={element.props.height}
          opacity={element.props.opacity || 0.3}
        />
      </Group>
    )
  }
  
  return (
    <div 
      ref={containerRef}
      className="flex items-center justify-center w-full h-full bg-gray-100 dark:bg-gray-900 p-4 overflow-hidden"
    >
      <div 
        className="shadow-2xl rounded-lg overflow-hidden bg-white dark:bg-gray-800"
      >
        <Stage
          ref={stageRef}
          width={scaledWidth}
          height={scaledHeight}
          scaleX={scale}
          scaleY={scale}
          onClick={(e: any) => {
            // Deselect if clicking stage background
            if (e.target === e.target.getStage()) {
              setSelectedElementId(null)
            }
          }}
        >
          <Layer>
            {renderBackground()}
            {/* Sort elements by zIndex before rendering */}
            {Array.isArray(currentSlide.elements) && currentSlide.elements.length > 0 ? (
              [...currentSlide.elements]
                .sort((a, b) => (a.props.zIndex || 0) - (b.props.zIndex || 0))
                .map((element, index) => renderElement(element, index))
            ) : (
              <Text
                x={CANVAS_WIDTH / 2 - 200}
                y={CANVAS_HEIGHT / 2 - 50}
                width={400}
                height={100}
                text="No elements on this slide"
                fontSize={20}
                fill="#999"
                align="center"
                verticalAlign="middle"
              />
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
