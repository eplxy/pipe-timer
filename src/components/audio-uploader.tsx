import { useCallback, useEffect, useRef, useState } from "react"
import { useDropzone } from "react-dropzone"
import { get, set } from "idb-keyval"
import { Button } from "./ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"

export interface AudioFileInfo {
  name: string
  type: string
  size: number
}

const STORED_AUDIO_KEY = "uploaded-audio-file"

function Dropzone(props: {
  onFileAdded: (file: File) => void
  fileInfo: AudioFileInfo | null
}) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        props.onFileAdded(acceptedFiles[0])
      }
    },
    [props]
  )
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a", ".mp4"],
    },
  })
  let statusText = "drag and drop files here"
  if (isDragActive) {
    statusText = "drop your audio file here"
  }
  if (props.fileInfo) {
    statusText = `selected: ${props.fileInfo.name}`
  }

  return (
    <div className="rounded-md border-2 border-dashed p-6" {...getRootProps()}>
      <input {...getInputProps()} />
      <p>{statusText}</p>
    </div>
  )
}

interface AudioUploaderProps {
  onAudioReady: (audioUrl: string | null) => void
}

export default function AudioUploader({ onAudioReady }: AudioUploaderProps) {
  const [fileInfo, setFileInfo] = useState<AudioFileInfo | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  const replaceObjectUrl = useCallback(
    (nextUrl: string | null) => {
      if (objectUrlRef.current && objectUrlRef.current !== nextUrl) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
      objectUrlRef.current = nextUrl
      onAudioReady(nextUrl)
    },
    [onAudioReady]
  )

  useEffect(() => {
    void (async () => {
      const storedFile = await get<File>(STORED_AUDIO_KEY)
      if (!storedFile) {
        replaceObjectUrl(null)
        return
      }

      setFileInfo({
        name: storedFile.name,
        size: storedFile.size,
        type: storedFile.type,
      })
      replaceObjectUrl(URL.createObjectURL(storedFile))
    })()
  }, [replaceObjectUrl])

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  const handleFileAdded = useCallback(
    async (file: File) => {
      await set(STORED_AUDIO_KEY, file)
      setFileInfo({
        name: file.name,
        size: file.size,
        type: file.type,
      })
      replaceObjectUrl(URL.createObjectURL(file))
    },
    [replaceObjectUrl]
  )

  const getOpenDialogButtonText = () => {
    if (fileInfo) {
      return "change audio file"
    }
    return "select audio file"
  }

  return (
    <div className="flex flex-col p-6">
      <h1 className="font-medium">upload your own sound effect</h1>

      <Dialog modal>
        <DialogTrigger
          render={
            <Button className="w-fit self-center">
              {getOpenDialogButtonText()}
            </Button>
          }
        />
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>upload audio</DialogTitle>
            <DialogDescription>
              select an audio file to use as your interval timer sound effect.
            </DialogDescription>
          </DialogHeader>
          <Dropzone onFileAdded={handleFileAdded} fileInfo={fileInfo} />
          <DialogFooter>
            <Button
              variant="destructive"
              disabled={!fileInfo}
              onClick={async () => {
                await set(STORED_AUDIO_KEY, undefined)
                setFileInfo(null)
                replaceObjectUrl(null)
              }}
            >
              reset
            </Button>
            <DialogClose render={<Button variant="outline">close</Button>} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
