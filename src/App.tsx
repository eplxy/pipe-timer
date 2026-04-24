import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "./components/ui/field"
import { Input } from "./components/ui/input"
import { useCallback, useEffect, useRef, useState } from "react"
import { Progress } from "./components/ui/progress"
import metalPipeSound from "./assets/metal-pipe-falling.mp3"
import AudioUploader from "./components/audio-uploader"

export function App() {
  const [durationInSec, setDurationInSec] = useState<number>(12)
  const [displayedDuration, setDisplayedDuration] =
    useState<number>(durationInSec)
  const [timeLeftInSec, setTimeLeftInSec] = useState<number>(12)
  const [completedIntervals, setCompletedIntervals] = useState<number>(0)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isRunningRef = useRef<boolean>(false)
  const activeAudioSource = uploadedAudioUrl ?? metalPipeSound

  const getProgress = () => {
    return ((durationInSec - timeLeftInSec) / durationInSec) * 100
  }
  const formattedTime = new Date(timeLeftInSec * 1000)
    .toISOString()
    .slice(14, 19)

  useEffect(() => {
    audioRef.current = new Audio(activeAudioSource)
    audioRef.current.preload = "auto"

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [activeAudioSource])

  const unlockAudio = async () => {
    if (!audioRef.current) return

    try {
      audioRef.current.muted = true
      audioRef.current.currentTime = 0
      await audioRef.current.play()
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.muted = false
    } catch {}
  }

  const playSoundEffect = () => {
    if (!audioRef.current) return

    audioRef.current.currentTime = 0
    void audioRef.current.play().catch(() => {})
  }

  const handleIntervalCompletion = () => {
    setCompletedIntervals((count) => count + 1)
    playSoundEffect()
  }

  const tick = useCallback(() => {
    setTimeLeftInSec((prev) => {
      if (prev > 1) {
        return prev - 1
      }

      handleIntervalCompletion()
      return durationInSec
    })
  }, [durationInSec])

  useEffect(() => {
    isRunningRef.current = isRunning
  }, [isRunning])

  useEffect(() => {
    if (!isRunningRef.current) {
      setTimeLeftInSec(durationInSec)
    }
  }, [durationInSec])

  useEffect(() => {
    if (!isRunning) return

    const id = globalThis.setInterval(tick, 1000)

    return () => globalThis.clearInterval(id)
  }, [isRunning, tick])

  const handleDurationChange = (value: string) => {
    const parsed = Number(value)
    const safeDuration = Number.isFinite(parsed)
      ? Math.max(1, Math.floor(parsed))
      : 10
    setDurationInSec(safeDuration)
    setDisplayedDuration(safeDuration)
  }

  const handleReset = () => {
    setIsRunning(false)
    setCompletedIntervals(0)
    setTimeLeftInSec(durationInSec)
  }

  const handleToggleRunning = async () => {
    if (!isRunning) {
      await unlockAudio()
    }

    setIsRunning((prev) => !prev)
  }

  return (
    <div className="flex min-h-svh p-6">
      <div className="m-auto flex max-w-md min-w-0 flex-col items-center gap-4 text-sm leading-loose">
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-medium">metal pipe interval timer</h1>
          <p>select the duration of the interval</p>
          <Field className="w-32">
            <FieldLabel>Duration (s)</FieldLabel>
            <Input
              value={displayedDuration}
              onChange={(e) => setDisplayedDuration(e.target.valueAsNumber)}
              type="number"
              onBlur={() => handleDurationChange(displayedDuration.toString())}
              id="time-picker-optional"
              min="1"
              step="1"
              className="[appearance:textfield] bg-background [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </Field>
          <AudioUploader onAudioReady={setUploadedAudioUrl} />

          <br className="mt-10" />

          <p className="text-4xl font-semibold tabular-nums">{formattedTime}</p>
          <Progress value={getProgress()} className="w-[80%]" />
          <p className="text-muted-foreground">
            completed intervals: {completedIntervals}
          </p>

          <div className="mt-2 flex gap-2">
            <Button
              onClick={handleToggleRunning}
              variant={isRunning ? "secondary" : "default"}
            >
              {isRunning ? "pause" : "start"}
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
