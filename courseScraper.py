import requests
import json
import os
from bs4 import BeautifulSoup
import re


def get_class_num(title):
    titleParts = title.strip().split()
    num = titleParts[1].split('.')[0]
    return num


def list_to_text(arr):
    notes = ""
    for i in arr:
        notes = notes + i + "\n"
    return notes


def findPrereq(arr):
    pattern = r'\b[A-Z]{2,4}\s?\d[0-9]{2,3}\b'

    prerequisites = []
    next = False
    for i in arr:
        if 'Prerequisite' in i:
            next = True
            continue
        if next:
            prerequisites = re.findall(pattern, i)
            next = False
            break

    noDecimalsPrereqs = []
    for i in prerequisites:
        noDecimalsPrereqs.append(i.split('.')[0])

    cleanedPrereqs = []
    for i in noDecimalsPrereqs:
        cleanedPrereqs.append(i.replace(" ", ""))

    return cleanedPrereqs


def fetch_subjects():
    url = "https://catalogue.usask.ca/"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    select = soup.find("select", id="subj-code")
    subjects = [option['value'] for option in select.find_all("option") if option['value']]
    return subjects


def fetch_courses(courseSubject):
    url = f"https://catalogue.usask.ca/?subj_code={courseSubject}&cnum="
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    courses = []
    course_elements = soup.find_all('div')

    for course in course_elements:
        if course.find('h4') is None:
            continue
        elif course.find('h4').find('a') is None:
            continue
        else:
            rawTitle = course.find('h4').find('a').text
            title = rawTitle.strip()

        number = get_class_num(title)
        name = courseSubject + number

        description = ""
        notes = ""
        prerequisite = []

        divRow = course.find('div', class_='row')
        if divRow:
            divCol = divRow.find('div', class_='col-md-7')
            if divCol:
                description = divCol.find('p').text

        if divRow:
            colPrereq = divRow.find('div', class_='col-md-5')
            if colPrereq:
                pTag = colPrereq.find('p')
                pTagList = list(pTag.stripped_strings)

                notes = list_to_text(pTagList)
                prerequisite = findPrereq(pTagList)

        courses.append({
            'title': title,
            'subject': courseSubject,
            'number': int(number),
            'class_name': name,
            'description': description,
            'notes': notes,
            'prerequisite': prerequisite
        })

    return courses


def main():
    all_courses = []

    subjects = fetch_subjects()

    for subject in subjects:
        print(f"Scraping {subject}...")
        courses = fetch_courses(subject)
        all_courses.extend(courses)

    with open("courses.json", "w", encoding="utf-8") as f:
        json.dump(all_courses, f, ensure_ascii=False, indent=2)

    print(f"Saved {len(all_courses)} courses to courses.json")


if __name__ == "__main__":
    main()