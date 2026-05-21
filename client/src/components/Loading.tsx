import { LoaderIcon } from "react-hot-toast"

const Loading = () => {
  return (
    <div className="flex-center min-h-96 h-full w-full">
        <LoaderIcon className="animate-spin size-8 text-gree-950"/>
    </div>
  )
}

export default Loading