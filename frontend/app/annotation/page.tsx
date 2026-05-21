import { AnnotationWorkspace } from "@/components/annotation-workspace";


export default async function AnnotationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const videoId = typeof params.videoId === "string" ? params.videoId : null;
  const youtubeVideoId = typeof params.youtubeVideoId === "string" ? params.youtubeVideoId : null;
  const youtubeUrl = typeof params.youtubeUrl === "string" ? params.youtubeUrl : null;

  const initialLoadedVideo =
    videoId && youtubeVideoId && youtubeUrl
      ? { id: videoId, youtubeVideoId, youtubeUrl }
      : null;

  return <AnnotationWorkspace initialLoadedVideo={initialLoadedVideo} />;
}
