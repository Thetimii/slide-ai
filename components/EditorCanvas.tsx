'use client'

import { useRef, useEffect, useState } from 'react'
import { useEditorStore } from '@/lib/store'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/lib/types'

export default function EditorCanvas() {
  const [isMounted, setIsMounted] = useState(false)
  const [Konva, setKonva] = useState<any>(null)
  
  useEffect(() => {
    // Dynamically import react-konva only on client side
    import('react-konva').then((module) => {
      setKonva(module)
      setIsMounted(true)
    })
  }, [])
  
  const { 
    presentation, 
    currentSlideIndex, 
    zoom,
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
  
  const { Stage, Layer, Rect, Text, Group } = Konva
  
  if (!presentation || !presentation.slides_json.slides[currentSlideIndex]) {
    return null
  }
  
  const currentSlide = presentation.slides_json.slides[currentSlideIndex]
  
  // Render background
  function renderBackground() {
    const { background } = currentSlide
    
    let fill = '#0B0D0F' // default
    
    if (background.type === 'solid' && background.solid) {
      fill = background.solid.color
    } else if (background.type === 'gradient' && background.gradient) {
      // For Konva, we'd need to use fillLinearGradientStartPoint, etc.
      // Simplified for now - just use first color
      fill = background.gradient.colors[0]
    }
    
    return (
      <Rect
        x={0}
        y={0}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        fill={fill}
      />
    )
  }
  
  // Render elements
  function renderElement(element: any, index: number) {
    const isSelected = element.id === selectedElementId
    
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
            fill={element.style?.fill || '#FFFFFF'}
            align={element.style?.align || 'left'}
            width={element.props.width}
            height={element.props.height}
            verticalAlign="middle"
          />
        </Group>
      )
    }
    
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
    
    if (element.type === 'shape') {
      // Render circles/ellipses
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
  
  return (
    <div className="inline-block shadow-2xl rounded-2xl overflow-hidden">
      <Stage
        ref={stageRef}
        width={CANVAS_WIDTH * zoom}
        height={CANVAS_HEIGHT * zoom}
        scaleX={zoom}
        scaleY={zoom}
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
          {[...currentSlide.elements]
            .sort((a, b) => (a.props.zIndex || 0) - (b.props.zIndex || 0))
            .map((element, index) => renderElement(element, index))}
        </Layer>
      </Stage>
    </div>
  )
}
