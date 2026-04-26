import { useParams } from 'react-router-dom'

function CoursePage() {
    const { courseId } = useParams()
    return <div>Course: {courseId}</div>
}

export default CoursePage