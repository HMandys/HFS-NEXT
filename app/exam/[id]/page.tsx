"use client"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/card"
import {useEffect, useRef, useState} from "react"
import {getExamOverviewAction, getExamRankInfoAction, getUserSnapshotAction} from "@/app/actions";
import {useRouter, useSearchParams} from "next/navigation";
import {formatTimestamp} from "@/utils/time";
import Navbar from "@/components/navBar";
import {ExamDetail, ExamRankInfo, UserSnapshot} from "@/types/exam";
import Snapshot from "@/app/exam/[id]/snapshot";
import {Radar} from "react-chartjs-2";
import {Chart as ChartJS, Filler, Legend, LineElement, PointElement, RadialLinearScale, Tooltip} from 'chart.js';
import toast from "react-hot-toast";
import html2canvas from "html2canvas";
import {SubjectHidingComponent, SubjectShowingComponent} from "@/app/exam/[id]/subject";

export default function ExamPage({params}: { params: { id: string } }) {
    ChartJS.register(
        RadialLinearScale,
        PointElement,
        LineElement,
        Filler,
        Tooltip,
        Legend
    );
    const router = useRouter()
    const searchParams = useSearchParams()
    // let advancedMode = searchParams.get("advanced")
    const [advancedMode, setAdvancedMode] = useState<boolean>(false)
    const [examDetail, setExamDetail] = useState<ExamDetail>()
    const [examRankInfo, setExamRankInfo] = useState<ExamRankInfo>()
    const [displayedPapersMode, setDisplayedPapersMode] = useState<{ [index: string]: boolean }>({}) // true为显示 false为隐藏
    const [userSnapshot, setUserSnapshot] = useState<UserSnapshot>()
    const [isExamSnapshotWindowOpen, setIsExamSnapshotWindowOpen] = useState(false);
    const [radarChartData, setRadarChartData] = useState<any>()
    const pageRef = useRef(null)

    useEffect(() => {
        const token = localStorage.getItem("hfs_token")
        if (!token) {
            toast.error("你还没登录诶！")
            router.push("/")
            return
        }
        if (searchParams.get("advanced")) {
            setAdvancedMode(("true" === searchParams.get("advanced")))
        } else {
            const localAdvancedMode = localStorage.getItem("advancedMode")
            if (localAdvancedMode) {
                setAdvancedMode(("1" === localAdvancedMode))
            }
        }
        getExamOverviewAction(token, params.id).then((exams) => {
            if (!exams.ok) {
                toast.error("获取考试详情失败：" + exams.errMsg)
                return
            }
            if (!exams.payload) {
                toast.error("获取考试详情失败：" + exams.errMsg)
                return
            }
            setRadarChartData({
                labels: exams.payload.papers.map(item => item.name),
                datasets: [
                    {
                        label: "你的得分",
                        data: exams.payload.papers.map(item => item.score),
                        fill: true,
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgb(255, 99, 132)',
                        pointBackgroundColor: 'rgb(255, 99, 132)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgb(255, 99, 132)'
                    },
                    {
                        label: "满分",
                        data: exams.payload.papers.map(item => item.manfen),
                        fill: true,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgb(54, 162, 235)',
                        pointBackgroundColor: 'rgb(54, 162, 235)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgb(54, 162, 235)'
                    }
                ]
            })
            setExamDetail(exams.payload)
        })
        getExamRankInfoAction(token, params.id).then((exams) => {
            if (!exams.ok) {
                toast.error("获取考试详情失败：" + exams.errMsg)
                return
            }
            if (!exams.payload) {
                toast.error("获取考试详情失败：" + exams.errMsg)
                return
            }
            setExamRankInfo(exams.payload)
        })
        getUserSnapshotAction(token).then((exams) => {
            if (!exams.ok) {
                toast.error("获取用户信息失败：" + exams.errMsg)
                return
            }
            if (!exams.payload) {
                toast.error("获取用户信息失败：" + exams.errMsg)
                return
            }
            setUserSnapshot(exams.payload)
        })
    }, [params.id, router, searchParams]);

    function changeDisplayedMode(paperId: string) {
        setDisplayedPapersMode((prevState) => {
            return {
                ...prevState,
                [paperId]: !prevState[paperId],
            }
        })
    }

    async function createScreenshot() {
        if (!pageRef.current) {
            throw new Error("组件根节点ref为null???")
        }
        const canvas = await html2canvas(pageRef.current, {
            useCORS: true,
            foreignObjectRendering: true,
        })
        const dataURL = canvas.toDataURL("image/png")
        const link = document.createElement('a')
        link.href = dataURL
        link.download = 'exam_' + params.id + '_screenshot.png'
        link.click()
    }

    return (
        <div
            className="flex flex-col mx-auto px-4 pt-6 pb-2 md:px-4 md:pt-6 md:pb-2 bg-white dark:bg-gray-900 min-h-screen select-none"
            ref={pageRef}>
            <Navbar router={router} userName={(userSnapshot) ? userSnapshot.linkedStudent.studentName : "xxx家长"}/>
            <div className="flex flex-col gap-6 pt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {(examDetail) ? examDetail.name : params.id}
                        </CardTitle>
                        <div data-html2canvas-ignore="true" className="flex flex-row pt-3 gap-3">
                            <div onClick={() => {
                                setIsExamSnapshotWindowOpen(true)
                            }}
                                 className="cursor-pointer flex-grow-0 border border-gray-400 rounded-full p-1 hover:bg-gray-200">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                     strokeWidth={1.5}
                                     stroke="currentColor" className="size-5">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                          d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"/>
                                </svg>
                            </div>
                            <div onClick={() => {
                                toast.promise(createScreenshot(), {
                                    loading: "正在截图",
                                    // success: "成功创建并下载截图！（答题卡图片空白是正常的）",
                                    success: <span>成功创建并下载截图！<br/>(答题卡图片空白是正常的)</span>,
                                    error: (err) => "创建截图失败，原因：" + err
                                }, {
                                    error: {
                                        duration: 5000
                                    },
                                    success: {
                                        duration: 5000
                                    }
                                })
                            }}
                                 className="cursor-pointer flex-grow-0 border border-gray-400 rounded-full p-1 hover:bg-gray-200">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                     strokeWidth={1.5} stroke="currentColor" className="size-5">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                                </svg>

                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">考试名</div>
                                <div className="font-medium">{(examDetail) ? examDetail.name : "..."}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">考试发布时间</div>
                                <div
                                    className="font-medium">{(examDetail) ? formatTimestamp(examDetail.time as number) : "..."}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">满分</div>
                                <div className="font-medium">{(examDetail) ? examDetail.manfen : "..."}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">得分</div>
                                <div className="font-medium">{(examDetail) ? examDetail.score : "..."}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">班级排名/等第</div>
                                <div
                                    className="font-medium">{(examDetail) ? (advancedMode) ? examDetail.classRank + " (打败了全班" + examDetail.classDefeatRatio + "%的人)" : examDetail.classRankPart : "..."}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">年级排名/等第</div>
                                <div
                                    className="font-medium">{(examDetail) ? (advancedMode) ? examDetail.gradeRank + " (打败了全年级" + examDetail.gradeDefeatRatio + "%的人)" : examDetail.gradeRankPart : "..."}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">班级最高分</div>
                                <div
                                    className="font-medium">{(examRankInfo) ? (advancedMode) ? examRankInfo.highest.class : "根据要求，该数据不允许展示" : "..."}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">年级最高分</div>
                                <div
                                    className="font-medium">{(examRankInfo) ? (advancedMode) ? examRankInfo.highest.grade : "根据要求，该数据不允许展示" : "..."}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">班级平均分</div>
                                <div
                                    className="font-medium">{(examRankInfo) ? (advancedMode) ? examRankInfo.avg.class : "根据要求，该数据不允许展示" : "..."}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">年级平均分</div>
                                <div
                                    className="font-medium">{(examRankInfo) ? (advancedMode) ? examRankInfo.avg.grade : "根据要求，该数据不允许展示" : "..."}</div>
                            </div>
                        </div>
                        <div className="h-80 w-80 justify-self-center">
                            {(radarChartData) ? <Radar data={radarChartData} datasetIdKey="radar"/> : <div/>}
                        </div>
                        {/* 快照弹窗 */}
                        {(isExamSnapshotWindowOpen) && <Snapshot onClose={() => {
                            setIsExamSnapshotWindowOpen(false)
                        }}/>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>各科分析</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4">
                            {examDetail?.papers.map((item) => {
                                let component
                                (!displayedPapersMode[item.paperId]) ?
                                    component =
                                        <SubjectHidingComponent paper={item} changeDisplayMode={changeDisplayedMode}
                                                                key={item.paperId}/>
                                    : component =
                                        <SubjectShowingComponent paper={item} changeDisplayMode={changeDisplayedMode}
                                                                 advancedMode={advancedMode} router={router}
                                                                 examId={String(examDetail?.examId)} key={item.paperId}/>
                                return component
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="pt-10 divide-y">
                <div></div>
                <div className="pt-2 flex justify-between flex-col md:flex-row">
                    <span className="text-gray-500 text-xs flex items-center">
                      Open Source by UselessLab on
                      <span className="inline-flex items-center ml-1">
                        <a
                            href="https://github.com/yanyao2333/HFS-NEXT"
                            target="_blank"
                            className="ml-1">
                          <GithubSVGIcon/>
                      </a>
                        <a
                            href="https://github.com/yanyao2333/HFS-NEXT"
                            target="_blank"
                            className="ml-1 underline"
                        >
                          yanyao2333/HFS-NEXT
                        </a>
                      </span>
                    </span>
                    <span className="text-gray-500 text-xs content-center">
                      Powered by <a href="https://vercel.com" target="_blank" className="underline">Vercel</a>
                    </span>
                </div>
            </div>
        </div>
    )
}

function GithubSVGIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" height="50" viewBox="0 0 16 16" width="15" aria-hidden="true"
             className="">
            <path fill="currentColor"
                  d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
        </svg>
    )
}