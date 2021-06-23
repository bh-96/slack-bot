const express = require('express')
const request = require('request')
const bodyParser = require('body-parser')
const app = express()
const urlEncodedParser = bodyParser.urlencoded({ extended: false })

const responseURL = YOUR_WEBHOOK_URL

app.post('/slack/choice-class', urlEncodedParser, (req, res) => {
    res.status(200).end() // best practice to respond with empty 200 status code

    let message = {
        "text": "강의를 선택해주세요.\n",
        "attachments": [
            {
                "fallback": "버튼 생성 실패!",
                "callback_id": "button_tutorial",
                "color": "#3AA3E3",
                "attachment_type": "default",
                "actions": [
                    {
                        "name": "java",
                        "text": "Java 프로그래밍 입문",
                        "type": "button",
                        "value": "java"
                    },
                    {
                        "name": "spring",
                        "text": "Spring 입문",
                        "type": "button",
                        "value": "spring"
                    },
                    {
                        "name": "elk",
                        "text": "ELK 스택",
                        "type": "button",
                        "value": "elk",
                        "style": "primary"
                    },
                    {
                        "name": "kubernetes",
                        "text": "쿠버네티스",
                        "type": "button",
                        "value": "kubernetes",
                        "style": "danger"
                    }
                ]
            }
        ]
    }

    sendMessageToSlackResponseURL(responseURL, message)
})

let beforeEvent
let springBlockId = ''
let javaBlockId = ''

app.post('/slack/actions', urlEncodedParser, (req, res) => {
    res.status(200).end() // best practice to respond with 200 status
    let actionJSONPayload = JSON.parse(req.body.payload) // parse URL-encoded payload JSON string

    let clickedEvent = actionJSONPayload.actions[0].name

    console.log(clickedEvent)

    let message

    switch (clickedEvent) {
        case 'kubernetes':
            message = {
                "attachments": [
                    {
                        "color": "#f2c744",
                        "blocks": [
                            {
                                "type": "section",
                                "text": {
                                    "type": "mrkdwn",
                                    "text": "\'쉽게 시작하는 쿠버네티스(Kubernetes)\' 강의는 유료 강의로 링크 공유에 실패했습니다.\n"
                                }
                            }
                        ]
                    }
                ],
                "replace_original": false
            }
            break

        case 'elk':
            message = {
                "attachments": [
                    {
                        "color": "#f2c744",
                        "blocks": [
                            {
                                "type": "section",
                                "text": {
                                    "type": "mrkdwn",
                                    "text": "<https://www.inflearn.com/course/elk-%EC%8A%A4%ED%83%9D-%EB%8D%B0%EC%9D%B4%ED%84%B0-%EB%B6%84%EC%84%9D/dashboard|ELK 스택 (ElasticSearch, Logstash, Kibana) 으로 데이터 분석>"
                                }
                            }
                        ]
                    }
                ]
            }
            break

        case 'spring':
            beforeEvent = clickedEvent
            message = inputMessage('\'스프링 프레임워크\' 또는 \'스프링 부트\' 를 입력해주세요.')
            springBlockId = ''
            break

        case 'java':
            beforeEvent = clickedEvent
            message = inputMessage('\'자바 입문\' 또는 \'자바8\' 을 입력해주세요.')
            springBlockId = ''
            break

        default:
            let blockId = actionJSONPayload.actions[0].block_id

            settingBlockId(blockId)

            let searchGb = springBlockId === blockId ? 'Spring' : javaBlockId === blockId ? 'Java' : ''

            let searchVal = actionJSONPayload.actions[0].value

            let link = searchVal === '스프링 부트' ? "<https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%EC%9E%85%EB%AC%B8-%EC%8A%A4%ED%94%84%EB%A7%81%EB%B6%80%ED%8A%B8/dashboard|스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술>" :
                searchVal === '스프링 프레임워크' ? "<https://www.inflearn.com/course/spring/dashboard|스프링 프레임워크 입문>" :
                    searchVal === '자바 입문' ? "<https://www.inflearn.com/course/%EC%8B%A4%EC%A0%84-%EC%9E%90%EB%B0%94_java-renew/dashboard|자바 프로그래밍 입문 강좌 (renew ver.) - 초보부터 개발자 취업까지!!>" :
                        searchVal === '자바8' ? "\'더 자바, Java 8\' 강의는 유료 강의로 링크 공유에 실패했습니다.\n" : "올바르지 않은 형식 입니다! :thinking_face:\n"

            message = {
                "attachments": [
                    {
                        "color": "#f2c744",
                        "blocks": [
                            {
                                "type": "section",
                                "text": {
                                    "type": "mrkdwn",
                                    "text": '<' + searchGb + '>\n' + link
                                }
                            }
                        ]
                    }
                ]
            }
            break
    }

    sendMessageToSlackResponseURL(responseURL, message)
})

function sendMessageToSlackResponseURL(responseURL, jsonMessage) {
    let postOptions = {
        uri: responseURL,
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        json: jsonMessage
    }

    request(postOptions, (error, response, body) => {
        if (error) {
            console.error(error)
        }
    })
}

function settingBlockId(blockId) {
    if (springBlockId === '' && beforeEvent === 'spring') {
        springBlockId = blockId
    } else if (javaBlockId === '' && beforeEvent === 'java') {
        javaBlockId = blockId
    }
}

function inputMessage(label) {
    return {
        "title": {
            "type": "plain_text",
            "text": "검색할 강의를 입력해주세요.",
            "emoji": true
        },
        "submit": {
            "type": "plain_text",
            "text": "검색",
            "emoji": true
        },
        "type": "modal",
        "blocks": [
            {
                "type": "input",
                "element": {
                    "type": "plain_text_input"
                },
                "label": {
                    "type": "plain_text",
                    "text": label,
                    "emoji": true
                },
                "dispatch_action": true
            }
        ]
    }
}

// API 서버 실행
app.listen(8110, () => {
    console.log('Server Connection!');
});
