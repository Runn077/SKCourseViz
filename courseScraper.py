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

def get_course_details(courseCode):
    url = f"https://catalogue.usask.ca/{courseCode}"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    subject_name = ""
    credits = ""
    offered = ""
    weekly_hours = ""
    college = ""
    department = ""

    section = soup.find("section", class_="uofs-section")
    if section:
        p = section.find("p")
        if p:
            for strong in p.find_all("strong"):
                label = strong.get_text(strip=True)

                value = ""
                if strong.next_sibling:
                    value = str(strong.next_sibling).strip()

                if "Subject" in label:
                    a = strong.find_next("a")
                    if a:
                        subject_name = a.get_text(strip=True)

                elif "Credit units" in label:
                    credits = value

                elif "Offered" in label:
                    offered = value

                elif "Weekly hours" in label:
                    weekly_hours = value

                elif "College" in label:
                    college = value

                elif "Department" in label:
                    department = value

    return {
        "subject": subject_name,
        "credits": credits,
        "offered": offered,
        "weekly_hours": weekly_hours,
        "college": college,
        "department": department
    }

def fetch_courses(courseSubject):
    seen_classes = set()
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

        course_code = f"{courseSubject}-{number}"

        if name in seen_classes:
            continue
        seen_classes.add(name)

        details = get_course_details(course_code)

        courses.append({
            'title': title,
            'subject_code': courseSubject,
            'number': int(number),
            'class_name': name,
            'description': description,
            'notes': notes,
            'prerequisite': prerequisite,
            "link": f"https://catalogue.usask.ca/{course_code}",

            # merge details
            "subject": details["subject"],
            "credits": details["credits"],
            "offered": details["offered"],
            "weekly_hours": details["weekly_hours"],
            "college": details["college"],
            "department": details["department"]
        })

    return courses

def main():
    all_courses = []

    subjects = ["CMPT"] #fetch_subjects()

    for subject_code in subjects:
        print(f"Scraping {subject_code}...")
        courses = fetch_courses(subject_code)
        all_courses.extend(courses)

    with open("test.json", "w", encoding="utf-8") as f:
        json.dump(all_courses, f, ensure_ascii=False, indent=2)

    print(f"Saved {len(all_courses)} courses to courses.json")
    

if __name__ == "__main__":
    main()